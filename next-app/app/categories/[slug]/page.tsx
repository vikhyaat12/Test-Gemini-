/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { store } from "@/lib/commerce/store";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
	const category = (await params).slug.replace(/-/g, " ").toLowerCase();
	const productsAll = await store.products.list();
	const products = productsAll.filter((p) => p.category.toLowerCase() === category);
	return (
		<main className="editorial">
			<Link href="/" className="back">← Queens Care</Link>
			<p className="eyebrow">Product category</p>
			<h1>{category}</h1>
			<div className="category-products">
				{products.map((p) => (
					<Link href={`/products/${p.slug}`} key={p.id}>
						<img src={p.image} alt={p.name} />
						<b>{p.name}</b>
						<span>₹{p.price.toLocaleString("en-IN")}</span>
					</Link>
				))}
			</div>
			{!products.length && <p>Our care team is curating this collection. Explore the full collection from the home page.</p>}
		</main>
	);
}
