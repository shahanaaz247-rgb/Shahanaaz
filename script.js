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


/* ================================
   BUYER LOGIN
================================ */

const buyerLoginForm =
    document.getElementById("buyerLoginForm");

if (buyerLoginForm) {

    buyerLoginForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const email =
                document.getElementById("email").value.trim();

            const password =
                document.getElementById("password").value.trim();


            if (email === "" || password === "") {

                alert("Please enter your email and password.");
                return;
            }


            try {

                const response = await fetch(
                    "https://shahanaaz-production-4093.up.railway.app/api/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            email: email,
                            password: password
                        })
                    }
                );


                const data = await response.json();


                if (response.ok) {

                    localStorage.setItem(
                        "user",
                        JSON.stringify(data.user)
                    );

                    alert("Login successful!");

                    window.location.href = "home.html";

                } else {

                    alert(data.message);

                }

            } catch (error) {

                console.error(error);

                alert("Unable to connect to server.");

            }

        }
    );
}


/* ================================
   BUYER REGISTRATION
================================ */

const registerForm =
    document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const name =
                document.getElementById("registerName").value.trim();

            const email =
                document.getElementById("registerEmail").value.trim();

            const password =
                document.getElementById("registerPassword").value.trim();


            if (
                name === "" ||
                email === "" ||
                password === ""
            ) {

                alert("Please fill all fields.");
                return;
            }


            try {

                const response = await fetch(
                    "https://shahanaaz-production-4093.up.railway.app/api/register",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            name: name,
                            email: email,
                            password: password
                        })
                    }
                );


                const data = await response.json();


                if (response.ok) {

                    alert("Account created successfully!");

                    window.location.href = "login.html";

                } else {

                    alert(data.message);

                }

            } catch (error) {

                console.error(error);

                alert("Unable to connect to server.");

            }

        }
    );
}


/* ================================
   PASSWORD TOGGLE
================================ */

function togglePassword() {

    const password =
        document.getElementById("password");

    if (!password) return;


    if (password.type === "password") {

        password.type = "text";

    } else {

        password.type = "password";

    }
}


function toggleRegisterPassword() {

    const password =
        document.getElementById("registerPassword");

    if (!password) return;


    if (password.type === "password") {

        password.type = "text";

    } else {

        password.type = "password";

    }
}


/* ================================
   FORGOT PASSWORD
================================ */

function forgotPassword(event) {

    event.preventDefault();

    alert(
        "Password reset feature will be implemented in the next stage."
    );
}


/* ================================
   ADD TO CART
================================ */

async function addToCart(productId) {

    const userData =
        localStorage.getItem("user");


    if (!userData) {

        alert("Please login first.");

        window.location.href = "login.html";

        return;
    }


    const user =
        JSON.parse(userData);


    try {

        const response = await fetch(
            "https://shahanaaz-production-4093.up.railway.app/api/cart",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    user_id: user.user_id,
                    product_id: productId,
                    quantity: 1
                })
            }
        );


        const data =
            await response.json();


        if (response.ok) {

            alert(
                "Product added to cart successfully!"
            );

        } else {

            alert(
                data.message || "Failed to add product to cart."
            );

        }

    } catch (error) {

        console.error(error);

        alert(
            "Unable to connect to server."
        );

    }
}