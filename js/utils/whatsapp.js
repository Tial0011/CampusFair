export function openWhatsApp({ phone, productName, price }) {
  const message = `Hi, I want to purchase ${productName} for ₦${price}`;
  const url = `https://wa.me/234${phone.replace(/^0/, "")}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}
