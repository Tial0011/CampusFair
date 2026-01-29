import { openWhatsApp } from "../utils/whatsapp.js";

export function ProductCard(product, store) {
  const card = document.createElement("div");

  const img = document.createElement("img");
  img.src = product.imageUrl;

  const name = document.createElement("h4");
  name.textContent = product.name;

  const price = document.createElement("p");
  price.textContent = `₦${product.price}`;

  const btn = document.createElement("button");
  btn.textContent = "Order on WhatsApp";
  btn.onclick = () => {
    openWhatsApp({
      phone: store.phone,
      productName: product.name,
      price: product.price,
    });
  };

  card.append(img, name, price, btn);
  return card;
}
