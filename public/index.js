fetch("/cookie/get")
  .then((res) => res.json())
  .then((data) => {
    if (!data.signed["x-auth"]) window.location = "/login.html";
  });

document.getElementById("product-btn1").onclick = () => {
  document
    .getElementById("display-img")
    .setAttribute(
      "src",
      document.getElementById("product-img1").attributes.src.value
    );
  document.getElementById("display-name").innerText =
    document.getElementById("product-name1").innerText;
  document.getElementById("display-desc").innerText =
    document.getElementById("product-desc1").innerText;
};

document.getElementById("product-btn2").onclick = () => {
  document
    .getElementById("display-img")
    .setAttribute(
      "src",
      document.getElementById("product-img2").attributes.src.value
    );
  document.getElementById("display-name").innerText =
    document.getElementById("product-name2").innerText;
  document.getElementById("display-desc").innerText =
    document.getElementById("product-desc2").innerText;
};
