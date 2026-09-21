const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

const imagePath = path.join(__dirname, "../image");

if (!fs.existsSync(imagePath)) {
    fs.mkdirSync(imagePath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imagePath);
    },

    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.use(
    "/images",
    express.static(imagePath)
);


// ================= LOGIN =================

app.post("/api/login", (req, res) => {

    const { email, password } = req.body;

    const sql = `
        SELECT user_id, name, email, role
        FROM users
        WHERE email = ? AND password = ?
    `;

    db.query(
        sql,
        [email, password],
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (results.length === 0) {

                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }

            res.json({
                message: "Login successful",
                user: results[0]
            });

        }
    );
});


// ================= BUYER REGISTER =================

app.post("/api/register", (req, res) => {

    const { name, email, password } = req.body;

    const sql = `
        INSERT INTO users
        (name, email, password, role)
        VALUES (?, ?, ?, 'buyer')
    `;

    db.query(
        sql,
        [name, email, password],
        (err, result) => {

            if (err) {

                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(400).json({
                        message: "Email already registered"
                    });
                }

                return res.status(500).json({
                    message: "Registration failed"
                });
            }

            res.json({
                message: "Registration successful"
            });

        }
    );
});


// ================= SELLER REGISTER =================

app.post("/api/seller/register", (req, res) => {

    const { name, email, password } = req.body;

    const sql = `
        INSERT INTO users
        (name, email, password, role)
        VALUES (?, ?, ?, 'seller')
    `;

    db.query(
        sql,
        [name, email, password],
        (err, result) => {

            if (err) {

                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(400).json({
                        message: "Email already registered"
                    });
                }

                return res.status(500).json({
                    message: "Seller registration failed"
                });
            }

            res.json({
                message: "Seller registration successful"
            });

        }
    );
});


// ================= GET ALL PRODUCTS =================

app.get("/api/products", (req, res) => {

    const sql = `
        SELECT *
        FROM products
        ORDER BY product_id DESC
    `;

    db.query(
        sql,
        (err, results) => {

            if (err) {

                return res.status(500).json({
                    message: "Failed to load products"
                });
            }

            res.json(results);

        }
    );
});


// ================= SELLER PRODUCTS =================

app.get("/api/products/seller/:seller_id", (req, res) => {

    const seller_id =
        Number(req.params.seller_id);

    const sql = `
        SELECT *
        FROM products
        WHERE seller_id = ?
        ORDER BY product_id DESC
    `;

    db.query(
        sql,
        [seller_id],
        (err, results) => {

            if (err) {

                return res.status(500).json({
                    message: "Failed to load seller products"
                });
            }

            res.json(results);

        }
    );
});


// ================= ADD PRODUCT =================

app.post(
    "/api/products",
    upload.single("image"),
    (req, res) => {

        const {
            name,
            category,
            price,
            stock,
            seller_id
        } = req.body;

        const image =
            req.file
                ? req.file.filename
                : null;

        const sql = `
            INSERT INTO products
            (seller_id, name, category, price, stock, image)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                seller_id,
                name,
                category,
                price,
                stock,
                image
            ],
            (err, result) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        message: "Failed to add product"
                    });
                }

                res.json({
                    message: "Product added successfully",
                    product_id: result.insertId
                });

            }
        );
    }
);


// ================= SELLER EDIT PRODUCT =================

app.put("/api/products/:product_id", (req, res) => {

    const product_id =
        Number(req.params.product_id);

    const {
        name,
        category,
        price,
        stock,
        seller_id
    } = req.body;

    const checkSql = `
        SELECT *
        FROM products
        WHERE product_id = ?
        AND seller_id = ?
    `;

    db.query(
        checkSql,
        [product_id, seller_id],
        (err, results) => {

            if (err) {

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (results.length === 0) {

                return res.status(404).json({
                    message: "Invalid product or seller"
                });
            }

            const updateSql = `
                UPDATE products
                SET name = ?,
                    category = ?,
                    price = ?,
                    stock = ?
                WHERE product_id = ?
                AND seller_id = ?
            `;

            db.query(
                updateSql,
                [
                    name,
                    category,
                    price,
                    stock,
                    product_id,
                    seller_id
                ],
                (err) => {

                    if (err) {

                        return res.status(500).json({
                            message: "Failed to update product"
                        });
                    }

                    res.json({
                        message: "Product updated successfully"
                    });

                }
            );

        }
    );
});


// ================= SELLER DELETE PRODUCT =================

app.delete("/api/products/:product_id", (req, res) => {

    const product_id =
        Number(req.params.product_id);

    const seller_id =
        req.body
            ? Number(req.body.seller_id)
            : null;

    if (!seller_id) {

        return res.status(400).json({
            message: "Invalid product or seller"
        });
    }

    const checkSql = `
        SELECT *
        FROM products
        WHERE product_id = ?
        AND seller_id = ?
    `;

    db.query(
        checkSql,
        [product_id, seller_id],
        (err, results) => {

            if (err) {

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (results.length === 0) {

                return res.status(404).json({
                    message: "Invalid product or seller"
                });
            }

            const deleteSql = `
                DELETE FROM products
                WHERE product_id = ?
                AND seller_id = ?
            `;

            db.query(
                deleteSql,
                [product_id, seller_id],
                (err) => {

                    if (err) {

                        return res.status(500).json({
                            message: "Failed to delete product"
                        });
                    }

                    res.json({
                        message: "Product deleted successfully"
                    });

                }
            );

        }
    );
});


// ================= ADMIN ADD/EDIT PRODUCT =================

app.put(
    "/api/admin/products/:product_id",
    (req, res) => {

        const product_id =
            Number(req.params.product_id);

        const {
            name,
            category,
            price,
            stock,
            seller_id
        } = req.body;

        const checkSql = `
            SELECT *
            FROM products
            WHERE product_id = ?
        `;

        db.query(
            checkSql,
            [product_id],
            (err, results) => {

                if (err) {

                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                if (results.length === 0) {

                    return res.status(404).json({
                        message: "Product not found"
                    });
                }

                const updateSql = `
                    UPDATE products
                    SET name = ?,
                        category = ?,
                        price = ?,
                        stock = ?,
                        seller_id = ?
                    WHERE product_id = ?
                `;

                db.query(
                    updateSql,
                    [
                        name,
                        category,
                        price,
                        stock,
                        seller_id,
                        product_id
                    ],
                    (err) => {

                        if (err) {

                            return res.status(500).json({
                                message: "Failed to update product"
                            });
                        }

                        res.json({
                            message: "Product updated successfully"
                        });

                    }
                );

            }
        );
    }
);


// ================= ADMIN DELETE PRODUCT =================

app.delete(
    "/api/admin/products/:product_id",
    (req, res) => {

        const product_id =
            Number(req.params.product_id);

        const checkSql = `
            SELECT *
            FROM products
            WHERE product_id = ?
        `;

        db.query(
            checkSql,
            [product_id],
            (err, results) => {

                if (err) {

                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                if (results.length === 0) {

                    return res.status(404).json({
                        message: "Product not found"
                    });
                }

                const deleteSql = `
                    DELETE FROM products
                    WHERE product_id = ?
                `;

                db.query(
                    deleteSql,
                    [product_id],
                    (err) => {

                        if (err) {

                            if (
                                err.code === "ER_ROW_IS_REFERENCED_2" ||
                                err.code === "ER_ROW_IS_REFERENCED"
                            ) {

                                return res.status(409).json({
                                    message:
                                        "This product is already used in cart or orders and cannot be deleted."
                                });
                            }

                            return res.status(500).json({
                                message: "Failed to delete product"
                            });
                        }

                        res.json({
                            message: "Product deleted successfully"
                        });

                    }
                );

            }
        );
    }
);


// ================= ADD TO CART =================

app.post("/api/cart", (req, res) => {

    const {
        user_id,
        product_id,
        quantity
    } = req.body;

    const checkSql = `
        SELECT *
        FROM cart
        WHERE user_id = ?
        AND product_id = ?
    `;

    db.query(
        checkSql,
        [user_id, product_id],
        (err, results) => {

            if (err) {

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (results.length > 0) {

                const newQuantity =
                    results[0].quantity +
                    Number(quantity);

                const updateSql = `
                    UPDATE cart
                    SET quantity = ?
                    WHERE cart_id = ?
                `;

                db.query(
                    updateSql,
                    [
                        newQuantity,
                        results[0].cart_id
                    ],
                    (err) => {

                        if (err) {

                            return res.status(500).json({
                                message: "Failed to update cart"
                            });
                        }

                        res.json({
                            message: "Cart updated successfully"
                        });

                    }
                );

            } else {

                const insertSql = `
                    INSERT INTO cart
                    (user_id, product_id, quantity)
                    VALUES (?, ?, ?)
                `;

                db.query(
                    insertSql,
                    [
                        user_id,
                        product_id,
                        quantity
                    ],
                    (err) => {

                        if (err) {

                            return res.status(500).json({
                                message: "Failed to add to cart"
                            });
                        }

                        res.json({
                            message: "Product added to cart"
                        });

                    }
                );

            }

        }
    );
});


// ================= GET CART =================

app.get("/api/cart/:user_id", (req, res) => {

    const user_id =
        Number(req.params.user_id);

    const sql = `
        SELECT
            cart.cart_id,
            cart.quantity,
            products.product_id,
            products.name,
            products.price,
            products.image,
            products.stock
        FROM cart
        JOIN products
        ON cart.product_id = products.product_id
        WHERE cart.user_id = ?
    `;

    db.query(
        sql,
        [user_id],
        (err, results) => {

            if (err) {

                return res.status(500).json({
                    message: "Failed to load cart"
                });
            }

            res.json(results);

        }
    );
});


// ================= UPDATE CART =================

app.put("/api/cart/:cart_id", (req, res) => {

    const cart_id =
        Number(req.params.cart_id);

    const quantity =
        Number(req.body.quantity);

    if (quantity <= 0) {

        return res.status(400).json({
            message: "Quantity must be greater than 0"
        });
    }

    const sql = `
        UPDATE cart
        SET quantity = ?
        WHERE cart_id = ?
    `;

    db.query(
        sql,
        [quantity, cart_id],
        (err) => {

            if (err) {

                return res.status(500).json({
                    message: "Failed to update cart"
                });
            }

            res.json({
                message: "Cart updated successfully"
            });

        }
    );
});


// ================= DELETE CART =================

app.delete("/api/cart/:cart_id", (req, res) => {

    const cart_id =
        Number(req.params.cart_id);

    const sql = `
        DELETE FROM cart
        WHERE cart_id = ?
    `;

    db.query(
        sql,
        [cart_id],
        (err) => {

            if (err) {

                return res.status(500).json({
                    message: "Failed to remove cart item"
                });
            }

            res.json({
                message: "Item removed from cart"
            });

        }
    );
});


// ================= CREATE ORDER =================

app.post("/api/orders", (req, res) => {

    const {
        user_id,
        total_amount,
        address,
        payment_method
    } = req.body;

    const orderSql = `
        INSERT INTO orders
        (
            user_id,
            total_amount,
            address,
            payment_status,
            order_status
        )
        VALUES (?, ?, ?, 'Pending', 'Placed')
    `;

    db.query(
        orderSql,
        [
            user_id,
            total_amount,
            address
        ],
        (err, orderResult) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    message: "Failed to create order"
                });
            }

            const order_id =
                orderResult.insertId;

            const paymentSql = `
                INSERT INTO payments
                (
                    order_id,
                    amount,
                    payment_method,
                    payment_status
                )
                VALUES (?, ?, ?, 'Pending')
            `;

            db.query(
                paymentSql,
                [
                    order_id,
                    total_amount,
                    payment_method || "Cash on Delivery"
                ],
                (err) => {

                    if (err) {

                        console.error(err);

                        return res.status(500).json({
                            message: "Payment record failed"
                        });
                    }

                    const cartSql = `
                        SELECT
                            product_id,
                            quantity
                        FROM cart
                        WHERE user_id = ?
                    `;

                    db.query(
                        cartSql,
                        [user_id],
                        (err, cartItems) => {

                            if (err) {

                                return res.status(500).json({
                                    message: "Failed to get cart"
                                });
                            }

                            if (cartItems.length === 0) {

                                return res.json({
                                    message: "Order created successfully",
                                    order_id: order_id
                                });
                            }

                            let completed =
                                0;

                            cartItems.forEach(item => {

                                const itemSql = `
                                    INSERT INTO order_items
                                    (
                                        order_id,
                                        product_id,
                                        quantity
                                    )
                                    VALUES (?, ?, ?)
                                `;

                                db.query(
                                    itemSql,
                                    [
                                        order_id,
                                        item.product_id,
                                        item.quantity
                                    ],
                                    () => {

                                        completed++;

                                        if (
                                            completed ===
                                            cartItems.length
                                        ) {

                                            const clearSql = `
                                                DELETE FROM cart
                                                WHERE user_id = ?
                                            `;

                                            db.query(
                                                clearSql,
                                                [user_id],
                                                () => {

                                                    res.json({
                                                        message:
                                                            "Order placed successfully",
                                                        order_id:
                                                            order_id
                                                    });

                                                }
                                            );

                                        }

                                    }
                                );

                            });

                        }
                    );

                }
            );

        }
    );
});


// ================= USER ORDERS =================

app.get("/api/orders/:user_id", (req, res) => {

    const user_id =
        Number(req.params.user_id);

    const sql = `
        SELECT *
        FROM orders
        WHERE user_id = ?
        ORDER BY order_id DESC
    `;

    db.query(
        sql,
        [user_id],
        (err, results) => {

            if (err) {

                return res.status(500).json({
                    message: "Failed to load orders"
                });
            }

            res.json(results);

        }
    );
});


// ================= ADMIN USERS =================

app.get("/api/admin/users", (req, res) => {

    const sql = `
        SELECT
            user_id,
            name,
            email,
            role
        FROM users
        ORDER BY user_id DESC
    `;

    db.query(
        sql,
        (err, results) => {

            if (err) {

                return res.status(500).json({
                    message: "Failed to load users"
                });
            }

            res.json(results);

        }
    );
});


// ================= ADMIN ORDERS =================

app.get("/api/admin/orders", (req, res) => {

    const sql = `
        SELECT *
        FROM orders
        ORDER BY order_id DESC
    `;

    db.query(
        sql,
        (err, results) => {

            if (err) {

                return res.status(500).json({
                    message: "Failed to load orders"
                });
            }

            res.json(results);

        }
    );
});


// ================= ADMIN UPDATE ORDER STATUS =================

app.put("/api/admin/orders/:order_id", (req, res) => {

    const order_id =
        Number(req.params.order_id);

    const { order_status } =
        req.body;

    const allowedStatuses = [
        "Placed",
        "Shipped",
        "Out for Delivery",
        "Delivered"
    ];

    if (!allowedStatuses.includes(order_status)) {

        return res.status(400).json({
            message: "Invalid order status"
        });
    }

    const sql = `
        UPDATE orders
        SET order_status = ?
        WHERE order_id = ?
    `;

    db.query(
        sql,
        [
            order_status,
            order_id
        ],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    message:
                        "Failed to update order status"
                });
            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    message: "Order not found"
                });
            }

            res.json({
                message:
                    "Order status updated successfully"
            });

        }
    );
});


// ================= HOME =================

app.get("/", (req, res) => {

    res.send(
        "Shahanaaz Mart Backend is running!"
    );

});


// ================= SERVER =================

app.listen(5000, () => {

    console.log(
        "Server running at http://localhost:5000"
    );

});