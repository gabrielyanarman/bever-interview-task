async function getUsers() {
  const response = await fetch(
    "https://bever-aca-assignment.azurewebsites.net/users"
  );
  const data = await response.json();
  return data.value;
}

async function login() {
  const user = {};
  user.login = loginInput.value;
  user.password = passwordInput.value;
  const userFound = await checkUser(user);

  loginInput.value = "";
  passwordInput.value = "";

  if (userFound) {
    localStorage.setItem("isAuth", true);
    localStorage.setItem("userId", userFound.UserId);
    window.location.href = `profile.html?userId=${userFound.UserId}`;
  } else {
    alert("user not found");
  }
}

async function checkUser(user) {
  const data = await getUsers();
  const userFound = data.find(
    (dataItem) =>
      dataItem.Name === user.login && dataItem.Password === user.password
  );
  return userFound;
}

const loginForm = document.querySelector(".login-form");
const loginInput = document.querySelector(".login-input");
const passwordInput = document.querySelector(".password-input");
const loginBtn = document.querySelector(".login-btn");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  login();
});
