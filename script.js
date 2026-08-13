function goToPage(page) {
    window.location.href = page;
}
/* ================================
   BUYER HOME PAGE FUNCTIONS
   ================================ */

function showDemoMessage(message) {
    alert(message + " feature will be implemented in the next stage.");
}


function scrollToProducts() {
    const products = document.getElementById("featured");

    if (products) {
        products.scrollIntoView({
            behavior: "smooth"
        });
    }
}
// Buyer Login
const buyerLoginForm = document.getElementById("buyerLoginForm");

if (buyerLoginForm) {
    buyerLoginForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (email === "" || password === "") {
            alert("Please enter your email and password.");
            return;
        }

        // Frontend demo login
        window.location.href = "home.html";
    });
}