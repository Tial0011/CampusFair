export function StoreForm(onSubmit) {
  const form = document.createElement("div");

  const title = document.createElement("h2");
  title.textContent = "Create Your Store";

  const storeName = document.createElement("input");
  storeName.placeholder = "Store name";

  const phone = document.createElement("input");
  phone.placeholder = "Business phone number";

  const description = document.createElement("textarea");
  description.placeholder = "Describe your business (long description)";

  const logo = document.createElement("input");
  logo.type = "file";
  logo.accept = "image/*";

  const instagram = document.createElement("input");
  instagram.placeholder = "Instagram link (optional)";

  const website = document.createElement("input");
  website.placeholder = "Website (optional)";

  const btn = document.createElement("button");
  btn.textContent = "Create Store";

  btn.onclick = () => {
    onSubmit({
      storeName: storeName.value.trim(),
      phone: phone.value.trim(),
      description: description.value.trim(),
      logoFile: logo.files[0],
      socials: {
        instagram: instagram.value.trim(),
        website: website.value.trim(),
      },
    });
  };

  form.append(
    title,
    storeName,
    phone,
    description,
    logo,
    instagram,
    website,
    btn,
  );

  return form;
}
