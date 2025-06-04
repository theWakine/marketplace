let products = [];
let cart = [];

// Загрузка товаров из JSON
async function loadProducts() {
  try {
    const response = await fetch('products.json');
    if (!response.ok) throw new Error('Не удалось загрузить товары');
    products = await response.json();
    renderProducts(products);
    setupCategoryFilters(); // Инициализируем фильтры после загрузки
  } catch (e) {
    document.getElementById("products").innerHTML = `<p style="color:red">${e.message}</p>`;
  }
}

// Добавьте эту функцию в ваш script.js
function setupCategoryFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Удаляем активный класс у всех кнопок
      filterButtons.forEach(btn => btn.classList.remove('active'));
      // Добавляем активный класс текущей кнопке
      button.classList.add('active');

      const category = button.dataset.category;
      filterProductsByCategory(category);
    });
  });
}

function filterProductsByCategory(category) {
  if (category === 'all') {
    renderProducts(products);
    return;
  }

  const filtered = products.filter(product =>
    product.category === category
  );
  renderProducts(filtered);
}

// Отображение товаров
function renderProducts(productList) {
  const container = document.getElementById("products");
  container.innerHTML = "";
  productList.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";
    product.quantity = 1; // Инициализируем количество

    // Проверяем sale и формируем HTML частично
    const hasSale = product.sale > 0;
    const saleBadge = hasSale ? `<span class="sale">${product.sale * 100}%</span>` : '';
    const oldPrice = hasSale
      ? `<p class="product-price-old"><s>${(product.price * (1 + product.sale)).toFixed(0)} ₽</s></p>`
      : '';

    card.innerHTML = `
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="product-info">
        <div class="product-prices">
          <div>
            <p class="product-price">${product.price} ₽</p>
            ${saleBadge}
          </div>
          ${oldPrice}
        </div>
        <h3 class="product-title">${product.name}</h3>
      </div>
      <button class="add-to-cart-btn" onclick='addToCart(${JSON.stringify(product)})'>Добавить в корзину</button>
    `;

    container.appendChild(card);
  });
}

// Добавление товара в корзину
function addToCart(product) {
  const existingItem = cart.find(item => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product });
  }

  updateCart();
  showToast("Выбранный товар был добавлен в корзину!", "success")

  document.getElementById("cart-buttons").classList.remove("hidden")
}

// Обновление корзины
function updateCart() {

  if (cart.length < 1) {
    document.getElementById("cart-buttons").classList.add("hidden")

  }

  const cartItemsContainer = document.getElementById("cart-items");
  const totalElement = document.getElementById("cart-total");

  cartItemsContainer.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "cart-item";

    itemDiv.innerHTML = `
      <img src="${item.image}" width="60" height="60">
      <div class="cart-item-info">
      <p class="cart-item-title">${item.name}</p>
      <p class="cart-item-price">${item.price * item.quantity} ₽</p>
      </div>
      <div class="cart-item-controls">
        <div class="quantity-controls">
          <button onclick="changeQuantity(${index}, -1)">−</button>
          <span class="quantity">${item.quantity}</span>
          <button onclick="changeQuantity(${index}, 1)">+</button>
        </div>
        <span class="cart-item-remove" onclick="removeFromCart(${index})">&times;</span>
      </div>
    `;

    cartItemsContainer.appendChild(itemDiv);
    total += item.price * item.quantity;
  });

  totalElement.textContent = total;
  document.getElementById("cart-count").textContent = getTotalItems();
}

// Изменение количества
function changeQuantity(index, delta) {
  const item = cart[index];
  item.quantity += delta;

  if (item.quantity <= 0) {
    cart.splice(index, 1);
  }

  updateCart();
}

// Удаление товара
function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

// Подсчёт общего числа товаров
function getTotalItems() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Очистка корзины
function clearCart() {
  cart = [];
  updateCart();
  showToast("Корзина была успешно очищена!", "success")
}

// Открытие модального окна оформления
function openCheckoutModal() {
  if (cart.length === 0) {
    showToast("Корзина пуста. Выберите товар.", "warning");
    return;
  }

  // Отображаем товары и сумму
  const cartSummary = document.getElementById("cart-summary");
  let total = 0;

  cartSummary.innerHTML = "<h3>Ваш заказ:</h3><ul>";

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    cartSummary.innerHTML += `
      <div class="ff192">
      <img src="${item.image}" width="60" height="60">
      <li>
        ${item.name} — 
        ${item.price.toLocaleString()} ₽ × ${item.quantity} шт. = 
        <strong>${itemTotal.toLocaleString()} ₽</strong>
      </li>
      </div>`;
  });

  let order = null
  let delivery = 0

  if (total < 999) {
    delivery += 299
    order = "Доставка 299₽"
  } else {
    order = "Доставка бесплатна"
    delivery += 0
  }

  cartSummary.innerHTML += `</ul><p><strong>Итого: ${total}₽ + ${order} = ${total + delivery}₽</strong></p>`;

  document.getElementById("checkout-modal").classList.remove("hidden");
  document.getElementById("checkout-form").classList.remove("hidden");
  document.getElementById("cart-modal").classList.toggle("hidden")
  document.getElementById("confirmation").classList.add("hidden");
  document.getElementById("fullname").value = "";
  document.getElementById("checkout-form").style.display = "block"
}

// Закрытие окна
document.getElementById("close-modal").addEventListener("click", () => {
  document.getElementById("checkout-modal").classList.add("hidden");
});


// Генератор трек-номера
function generateTrackNumber() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const prefix = letters.charAt(Math.floor(Math.random() * letters.length)) +
    letters.charAt(Math.floor(Math.random() * letters.length)) +
    letters.charAt(Math.floor(Math.random() * letters.length));
  const number = Math.floor(100000 + Math.random() * 900000);
  trackNumber = `${prefix}-${number}`
  showToast(`Товар оформлен, трек номер заказа ${trackNumber}`, "success")
  return `${trackNumber}`;

}

// Обработка формы
document.getElementById("checkout-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const fullname = document.getElementById("fullname").value.trim();
  let FIO = fullname.split(" ")

  if (FIO.length !== 3) {
    showToast("Введите верное ФИО, для оформления заказа", "warning")
    return
  }

  // Проверяем что данные введены
  if (fullname) {
    // Скрываем форму и показываем подтверждение
    this.style.display = "none";
    const confirmation = document.getElementById("confirmation");
    confirmation.classList.remove("hidden");

    // Генерируем трек-номер
    const trackNumber = generateTrackNumber();
    document.getElementById("track-number").textContent = trackNumber;

    track = document.getElementById("track")
    track.classList.remove("hidden")

    // Очистка корзины
    cart = [];
    updateCart();
  }
});

// Поиск товаров в реальном времени
document.getElementById("search-input").addEventListener("input", function () {
  const query = this.value.toLowerCase();
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(query)
  );
  renderProducts(filtered);
});
document.getElementById("cart-icon").addEventListener("click", function (e) {
  e.preventDefault();
  const cartModal = document.getElementById("cart-modal");
  if (cartModal.classList.contains("hidden")) {
    updateCart(); // Обновляем, чтобы показать актуальное состояние
  }
  cartModal.classList.toggle("hidden");
});

cart_close = document.getElementById("close-cart")
cart_close.addEventListener('click', function close_cart() {
  cartModal = document.getElementById("cart-modal").classList.toggle("hidden")
})

function showToast(message, type = "default", duration = 5000) {
  const container = document.getElementById("notification-container");

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div>${message}</div>
    <span class="close-btn" onclick="this.parentElement.remove()">×</span>
  `;

  container.appendChild(toast);

  // Автоматическое закрытие через заданное время
  setTimeout(() => {
    toast.style.opacity = 0;
    toast.style.transform = "translateX(-20px)";
    setTimeout(() => toast.remove(), 7500);
  }, duration);
}

document.getElementById("menu-toggle").addEventListener("click", function () {
  const nav = document.querySelector(".main-nav");
  nav.classList.toggle("active");
});

// Запуск при загрузке
loadProducts();