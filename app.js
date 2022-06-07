require("dotenv").config();

const accessTokenKey = process.env.ACCESS_TOKEN;
const accessSpaceKey = process.env.ACCESS_SPACE;


// setup for the content full
// eslint-disable-next-line no-undef
const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: accessSpaceKey,
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: accessTokenKey
});

const cartBtn = document.querySelector(".cart-btn");
const cartItems = document.querySelector(".cart-items");
const productsDOM = document.querySelector(".products-center");
const cartOverlay = document.querySelector(".cart-overlay");
const cartDom = document.querySelector(".cart");
const closeCartBtn = document.querySelector(".close-cart");
const cartContent = document.querySelector(".cart-content");
const cartTotal = document.querySelector(".cart-total");
const clearCartBtn = document.querySelector(".clear-cart");

let cart = [];
let buttonsDOM = [];

// getting product class
class Products {
  async getProducts() {
    try {

      const contentfull = await client.getEntries({
        content_type: "vickyHouseProducts"
      })

      let products = contentfull.items
      products = products.map(item => {
        const {title, price} = item.fields;
        const {id} = item.sys;
        const image = item.fields.image.fields.file.url;
        return {title, price, id, image}
      })
      return products;
    } catch(e) {
      console.log(e.message);
    }
  }

}

// display product class
class UI {
  displayProducts(products) {
    let result = "";
    products.forEach(product => {
      result += `
        <article class="product">
        <div class="img-container">
          <img src="${product.image}" class="product-img" alt="product-img">
          <button class="bag-btn" data-id=${product.id}>
            <i class="fas fa-shopping-cart"></i>
            Add to Cart
          </button>
        </div>
        <h3>${product.title}</h3>
        <h4><sup>$</sup>${product.price}</h4>
        </article>
      `
    })
    productsDOM.innerHTML = result;
  }

  getBagBtns() {
    const buttons = [...document.querySelectorAll(".bag-btn")];
    buttonsDOM = buttons;
    buttons.forEach(button => {
      const id = button.dataset.id;
      let inCart = cart.find(item => item.id === id);
      if(inCart) {
        button.innerText = "In Cart";
        button.disabled = true;
      } 
      button.addEventListener("click", (e) => {
        e.target.innerText = "In Cart";
        e.target.disabled = true;
        // get product from products
        let cartItem = {...Storage.getProducts(e.target.dataset.id), amount:1}
        cart = [...cart, cartItem];

        Storage.saveCart(cart)
        this.setCartValues(cart);
        this.addCartItem(cartItem);
        this.showCart();
      })
    })
  }

  setCartValues(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;

    cart.map(item => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    })

    cartTotal.innerText = parseFloat(tempTotal.toFixed(2))
    cartItems.innerText = itemsTotal;
  }

  addCartItem(item) {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
        <img src="${item.image}" alt="product2">
        <div>
          <h4>${item.title}</h4>
          <h5>$${item.price}</h5>
          <span class="remove-item" data-id=${item.id}>remove</span>
        </div>
        <div>
          <i class="fas fa-chevron-up" data-id=${item.id}></i>
          <p class="item-amount">${item.amount}</p>
          <i class="fas fa-chevron-down" data-id=${item.id}></i>
        </div>
    `;
    cartContent.appendChild(div);
  }

  showCart() {
    cartOverlay.classList.add("showOverlay");
    cartDom.classList.add("showCart")
  }

  setUpApp() {
    cart = Storage.getCart();
    this.setCartValues(cart);
    this.populate(cart);
    cartBtn.addEventListener("click", this.showCart);
    closeCartBtn.addEventListener("click", this.hideCart);
  }

  // get all the cart from local storage
  populate(cart) {
    cart.forEach(item => this.addCartItem(item));
  }

  hideCart() {
    cartOverlay.classList.remove("showOverlay");
    cartDom.classList.remove("showCart")
  }

  cartLogic() {
    clearCartBtn.addEventListener("click", () => {
      this.clearCart();
    })
    
    // cart functionality
    cartContent.addEventListener("click", (event) => {
      if(event.target.classList.contains("remove-item")) {
        const removeCartItem = event.target;
        const id = removeCartItem.dataset.id;
        cartContent.removeChild(removeCartItem.parentElement.parentElement)
        this.removeItem(id);
      }
      if(event.target.classList.contains("fa-chevron-up")) {
        const chevAdd = event.target;
        const id = chevAdd.dataset.id;
        const tempItem = cart.find(item => item.id === id);
        tempItem.amount += 1;
        Storage.saveCart(cart);
        this.setCartValues(cart);
        chevAdd.nextElementSibling.innerText = tempItem.amount;
      }
      if(event.target.classList.contains("fa-chevron-down")) {
        const chevSubtract = event.target;
        const id = chevSubtract.dataset.id;
        const tempItem = cart.find(item => item.id === id);
        tempItem.amount -= 1;
        if (tempItem.amount > 0) {
          Storage.saveCart(cart);
          this.setCartValues(cart);
          chevSubtract.previousElementSibling.innerText = tempItem.amount;
        } else {
          cartContent.removeChild(chevSubtract.parentElement.parentElement)
          this.removeItem(id);
        }
        
      }
    })
  }

  clearCart() {
    let cartItemsId = cart.map(item => item.id);
    cartItemsId.forEach(id => this.removeItem(id));

    while(cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0])
    }
    this.hideCart();
  }

  removeItem(id) {
    cart = cart.filter(item => item.id !== id);
    this.setCartValues(cart)
    Storage.saveCart(cart);
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML = `<i class="fas fa-shopping-cart"></i>ADD TO CART`;
  }

  getSingleButton(id) {
    return buttonsDOM.find(button => button.dataset.id === id);
  }

}

// localStorage class
class Storage {
  static saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products))
  }

  static saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart))
  }

  static getProducts(id) {
    const products = JSON.parse(localStorage.getItem("products"));
    return products.find(product => product.id === id)
  }

  static getCart() {
    return localStorage.getItem("cart") ? JSON.parse(localStorage.getItem("cart")) : [];
  }
}


document.addEventListener("DOMContentLoaded", () => {
  const ui = new UI();
  const products = new Products();
  
  ui.setUpApp();

  products.getProducts().then(products => {
    ui.displayProducts(products);
    Storage.saveProducts(products);
  }).then(() => {
    ui.getBagBtns();
    ui.cartLogic();
  })
})







