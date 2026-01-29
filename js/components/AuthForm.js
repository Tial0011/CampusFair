export function AuthForm({ title, buttonText, onSubmit }) {
  const container = document.createElement("div");

  const heading = document.createElement("h2");
  heading.textContent = title;

  const email = document.createElement("input");
  email.type = "email";
  email.placeholder = "Email";

  const password = document.createElement("input");
  password.type = "password";
  password.placeholder = "Password";

  const button = document.createElement("button");
  button.textContent = buttonText;

  button.onclick = () => {
    onSubmit(email.value.trim(), password.value.trim());
  };

  container.append(heading, email, password, button);
  return container;
}
