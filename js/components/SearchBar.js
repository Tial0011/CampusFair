export function SearchBar(onSearch) {
  const wrapper = document.createElement("div");

  const input = document.createElement("input");
  input.placeholder = "Search products on CampusFair...";
  input.type = "search";

  const btn = document.createElement("button");
  btn.textContent = "Search";

  btn.onclick = () => {
    onSearch(input.value.trim());
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      onSearch(input.value.trim());
    }
  });

  wrapper.append(input, btn);
  return wrapper;
}
