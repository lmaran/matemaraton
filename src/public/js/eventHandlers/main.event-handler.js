export const eventHandler = {
    updateCartIcon: async () => {
        const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
        if (cartItems) {
            const cartSpan = document.getElementById("cart-icon-span");
            cartSpan.textContent = cartItems.length;
        }
    },
};
