import { json, requireUser } from "@/lib/http";
import { store } from "@/lib/commerce/store";
import { fileDb } from "@/lib/commerce/file-db";
import type { Order } from "@/lib/commerce/types";

function parseDateRange(from?: string, to?: string): { start: Date; end: Date } {
  const end = to ? new Date(to + "T23:59:59.999Z") : new Date();
  const start = from ? new Date(from + "T00:00:00.000Z") : new Date(0);
  return { start, end };
}

function filterOrdersByDate(orders: Order[], start: Date, end: Date): Order[] {
  return orders.filter((o) => {
    const d = new Date(o.createdAt);
    return d >= start && d <= end;
  });
}

export async function GET(request: Request) {
  if (!(await requireUser(["admin"]))) return json({ error: "Unauthorized" }, 401);

  const url = new URL(request.url);
  const dateFrom = url.searchParams.get("from") || undefined;
  const dateTo = url.searchParams.get("to") || undefined;

  const orders = (await store.orders.list()) as Order[];
  const products = await store.products.all();
  const users = fileDb.findMany("users");

  const { start, end } = parseDateRange(dateFrom, dateTo);

  // Current period metrics
  const periodOrders = filterOrdersByDate(orders, start, end);
  const activeOrders = periodOrders.filter((o) => o.status !== "cancelled" && o.status !== "refunded" && o.status !== "returned");
  const cancelledOrders = periodOrders.filter((o) => o.status === "cancelled");
  const returnedOrders = periodOrders.filter((o) => o.status === "returned");
  const refundedOrders = periodOrders.filter((o) => o.status === "refunded");
  const pendingOrders = periodOrders.filter((o) => o.status === "pending" || o.status === "paid");
  const shippedOrders = periodOrders.filter((o) => o.status === "shipped");
  const deliveredOrders = periodOrders.filter((o) => o.status === "delivered");

  const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalDiscounts = periodOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
  const totalShipping = periodOrders.reduce((sum, o) => sum + (o.shippingFee || 0), 0);
  const totalTax = periodOrders.reduce((sum, o) => sum + (o.tax || 0), 0);
  const avgOrderValue = activeOrders.length > 0 ? Math.round(totalRevenue / activeOrders.length) : 0;

  // Previous period for comparison
  const periodMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - periodMs);
  const prevPeriodOrders = filterOrdersByDate(orders, prevStart, prevEnd);
  const prevActiveOrders = prevPeriodOrders.filter((o) => o.status !== "cancelled" && o.status !== "refunded" && o.status !== "returned");
  const prevRevenue = prevActiveOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const prevOrderCount = prevActiveOrders.length;
  const prevAvgOrder = prevOrderCount > 0 ? Math.round(prevRevenue / prevOrderCount) : 0;

  // Customer metrics
  const customerUsers = users.filter((u: Record<string, unknown>) => u.role === "customer");
  const totalCustomers = customerUsers.length;
  const orderUserIds = new Set(periodOrders.map((o) => o.userId).filter(Boolean));
  const prevOrderUserIds = new Set(prevPeriodOrders.map((o) => o.userId).filter(Boolean));
  const newCustomers = [...orderUserIds].filter((id) => !prevOrderUserIds.has(id)).length;
  const returningCustomers = [...orderUserIds].filter((id) => prevOrderUserIds.has(id)).length;

  // Product metrics
  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock < (p.lowStockThreshold || 10)).length;
  const outOfStockProducts = products.filter((p) => p.stock <= 0).length;
  const activeProducts = products.filter((p) => p.active).length;

  // Sales by product (top 10)
  const productSales: Record<string, { name: string; count: number; revenue: number }> = {};
  activeOrders.forEach((o) => {
    (o.lines || []).forEach((line) => {
      const product = products.find((p) => p.id === line.productId || p.slug === line.productId);
      const name = product?.name || line.productId;
      if (!productSales[line.productId]) productSales[line.productId] = { name, count: 0, revenue: 0 };
      productSales[line.productId].count += line.quantity;
      productSales[line.productId].revenue += (product?.price || 0) * line.quantity;
    });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Sales by category
  const categorySales: Record<string, number> = {};
  activeOrders.forEach((o) => {
    (o.lines || []).forEach((line) => {
      const product = products.find((p) => p.id === line.productId || p.slug === line.productId);
      const cat = product?.category || "Uncategorized";
      categorySales[cat] = (categorySales[cat] || 0) + (product?.price || 0) * line.quantity;
    });
  });
  const salesByCategory = Object.entries(categorySales).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, revenue]) => ({ name, revenue }));

  // Payment method distribution
  const paymentMethods: Record<string, number> = {};
  periodOrders.forEach((o) => {
    const method = o.paymentMethod || "unknown";
    paymentMethods[method] = (paymentMethods[method] || 0) + 1;
  });

  // Order status distribution
  const statusDistribution: Record<string, number> = {};
  periodOrders.forEach((o) => {
    statusDistribution[o.status] = (statusDistribution[o.status] || 0) + 1;
  });

  // Daily revenue for chart
  const dailyRevenue: Record<string, number> = {};
  activeOrders.forEach((o) => {
    const day = o.createdAt.slice(0, 10);
    dailyRevenue[day] = (dailyRevenue[day] || 0) + (o.total || 0);
  });
  const revenueOverTime = Object.entries(dailyRevenue).sort((a, b) => a[0].localeCompare(b[0])).map(([date, revenue]) => ({ date, revenue }));

  // Daily order count for chart
  const dailyOrders: Record<string, number> = {};
  periodOrders.forEach((o) => {
    const day = o.createdAt.slice(0, 10);
    dailyOrders[day] = (dailyOrders[day] || 0) + 1;
  });
  const ordersOverTime = Object.entries(dailyOrders).sort((a, b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count }));

  // Comparison helpers
  const pctChange = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

  return json({
    metrics: {
      totalOrders: periodOrders.length,
      totalRevenue,
      avgOrderValue,
      totalDiscounts,
      totalShipping,
      totalTax,
      totalCustomers,
      newCustomers,
      returningCustomers,
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      cancelledOrders: cancelledOrders.length,
      returnedOrders: returnedOrders.length,
      refundedOrders: refundedOrders.length,
      pendingOrders: pendingOrders.length,
      shippedOrders: shippedOrders.length,
      deliveredOrders: deliveredOrders.length,
    },
    comparison: {
      revenueChange: pctChange(totalRevenue, prevRevenue),
      ordersChange: pctChange(activeOrders.length, prevOrderCount),
      avgOrderChange: pctChange(avgOrderValue, prevAvgOrder),
      prevRevenue,
      prevOrders: prevOrderCount,
      prevAvgOrder,
    },
    topProducts,
    salesByCategory,
    paymentMethods,
    statusDistribution,
    revenueOverTime,
    ordersOverTime,
    recentOrders: periodOrders.slice(-10).reverse(),
    dateRange: { from: dateFrom || "all", to: dateTo || "now" },
  });
}
