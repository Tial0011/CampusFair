export function ProductForm(onSubmit) {
  const box = document.createElement("div");

  const title = document.createElement("h3");
  title.textContent = "Add New Product";

  const name = document.createElement("input");
  name.placeholder = "Product name";

  const description = document.createElement("textarea");
  description.placeholder = "Product description";

  const price = document.createElement("input");
  price.type = "number";
  price.placeholder = "Price (₦)";

  const image = document.createElement("input");
  image.type = "file";
  image.accept = "image/*";

  const btn = document.createElement("button");
  btn.textContent = "Add Product";

  btn.onclick = () => {
    onSubmit({
      name: name.value.trim(),
      description: description.value.trim(),
      price: Number(price.value),
      imageFile: image.files[0],
    });
  };

  box.append(title, name, description, price, image, btn);
  return box;
}
