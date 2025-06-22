
// script.js
class POSSystem {
    constructor() {
        this.currentUser = null;
        this.products = [
            { code: 'P001', name: 'Nasi Goreng', category: 'makanan', price: 15000, stock: 50 },
            { code: 'P002', name: 'Indomie', category: 'makanan', price: 15000, stock: 30 },
            { code: 'P003', name: 'Es Teh', category: 'minuman', price: 12000, stock: 100 },
            { code: 'P004', name: 'Kopi Susu', category: 'minuman', price: 20000, stock: 80 },
            { code: 'P005', name: 'Keripik', category: 'snack', price: 2000, stock: 25 },
            { code: 'P006', name: 'Latte', category: 'minuman', price: 18000, stock: 40 }
        ];
        this.cart = [];
        this.transactions = [];
        this.employees = {
            admin: { name: 'Administrator', pin: '0001', role: 'admin' },
            emp001: { name: 'Karyawan 1', pin: '4444', role: 'employee' },
            emp002: { name: 'Karyawan 2', pin: '5555', role: 'employee' }
        };
        
        this.initializeEventListeners();
        this.updateCurrentDate();
        this.loadCategoryFilter();
    }

    initializeEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Cashier
        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.displayProducts();
        });

        document.getElementById('paymentMethod').addEventListener('change', (e) => {
            this.togglePaymentDetails(e.target.value);
        });

        document.getElementById('cashReceived').addEventListener('input', () => {
            this.calculateChange();
        });

        document.getElementById('processPayment').addEventListener('click', () => {
            this.processPayment();
        });

        document.getElementById('clearCart').addEventListener('click', () => {
            this.clearCart();
        });

        // Products management
        document.getElementById('addProductBtn').addEventListener('click', () => {
            this.openProductModal();
        });

        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        // Reports
        document.getElementById('generateReport').addEventListener('click', () => {
            this.generateReport();
        });

        // Modal close
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });

        // Set default report date to today
        document.getElementById('reportDate').value = new Date().toISOString().split('T')[0];
    }

    handleLogin() {
        const employeeId = document.getElementById('employeeId').value;
        const pin = document.getElementById('pin').value;

        if (this.employees[employeeId] && this.employees[employeeId].pin === pin) {
            this.currentUser = {
                id: employeeId,
                ...this.employees[employeeId]
            };
            
            document.getElementById('currentUser').textContent = `Pengguna: ${this.currentUser.name}`;
            document.getElementById('loginScreen').classList.remove('active');
            document.getElementById('mainScreen').classList.add('active');
            
            // Set access permissions
            this.setAccessPermissions();
            
            // Initialize displays
            this.displayProducts();
            this.displayProductsTable();
            this.updateCartDisplay();
        } else {
            alert('ID Karyawan atau PIN salah!');
        }
    }

    setAccessPermissions() {
        const isAdmin = this.currentUser.role === 'admin';
        document.getElementById('productsNavBtn').disabled = !isAdmin;
        document.getElementById('reportsNavBtn').disabled = !isAdmin;
        
        if (!isAdmin) {
            document.getElementById('productsNavBtn').title = 'Hanya untuk Admin';
            document.getElementById('reportsNavBtn').title = 'Hanya untuk Admin';
        }
    }

    logout() {
        this.currentUser = null;
        this.cart = [];
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('mainScreen').classList.remove('active');
        document.getElementById('employeeId').value = '';
        document.getElementById('pin').value = '';
        this.switchSection('cashier');
    }

    switchSection(section) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
        });
        
        // Remove active class from nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected section
        document.getElementById(section + 'Section').classList.add('active');
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        
        // Load section specific data
        if (section === 'products') {
            this.displayProductsTable();
        } else if (section === 'reports') {
            this.generateReport();
        }
    }

    updateCurrentDate() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('currentDate').textContent = dateStr;
    }

    loadCategoryFilter() {
        const categories = [...new Set(this.products.map(p => p.category))];
        const filter = document.getElementById('categoryFilter');
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            filter.appendChild(option);
        });
    }

    displayProducts() {
        const selectedCategory = document.getElementById('categoryFilter').value;
        const filteredProducts = selectedCategory ? 
            this.products.filter(p => p.category === selectedCategory) : 
            this.products;
        
        const productsContainer = document.getElementById('productsList');
        productsContainer.innerHTML = '';
        
        filteredProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = `product-card ${product.stock === 0 ? 'out-of-stock' : ''}`;
            productCard.innerHTML = `
                <h4>${product.name}</h4>
                <div class="price">Rp ${product.price.toLocaleString('id-ID')}</div>
                <div class="stock">Stok: ${product.stock}</div>
            `;
            
            if (product.stock > 0) {
                productCard.addEventListener('click', () => {
                    this.addToCart(product);
                });
            }
            
            productsContainer.appendChild(productCard);
        });
    }

    addToCart(product) {
        const existingItem = this.cart.find(item => item.code === product.code);
        
        if (existingItem) {
            if (existingItem.quantity < product.stock) {
                existingItem.quantity++;
                existingItem.total = existingItem.quantity * existingItem.price;
            } else {
                alert('Stok tidak mencukupi!');
                return;
            }
        } else {
            this.cart.push({
                code: product.code,
                name: product.name,
                price: product.price,
                quantity: 1,
                total: product.price
            });
        }
        
        this.updateCartDisplay();
    }

    updateCartDisplay() {
        const cartContainer = document.getElementById('cartItems');
        cartContainer.innerHTML = '';
        
        this.cart.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <h5>${item.name}</h5>
                    <small>Rp ${item.price.toLocaleString('id-ID')} x ${item.quantity}</small>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="posSystem.updateQuantity(${index}, -1)">-</button>
                    <input type="number" class="qty-input" value="${item.quantity}" 
                           onchange="posSystem.setQuantity(${index}, this.value)" min="1">
                    <button class="qty-btn" onclick="posSystem.updateQuantity(${index}, 1)">+</button>
                    <button class="remove-btn" onclick="posSystem.removeFromCart(${index})">Hapus</button>
                </div>
            `;
            cartContainer.appendChild(cartItem);
        });
        
        this.updateCartSummary();
    }

    updateQuantity(index, change) {
        const item = this.cart[index];
        const product = this.products.find(p => p.code === item.code);
        const newQuantity = item.quantity + change;
        
        if (newQuantity <= 0) {
            this.removeFromCart(index);
        } else if (newQuantity <= product.stock) {
            item.quantity = newQuantity;
            item.total = item.quantity * item.price;
            this.updateCartDisplay();
        } else {
            alert('Stok tidak mencukupi!');
        }
    }

    setQuantity(index, quantity) {
        const item = this.cart[index];
        const product = this.products.find(p => p.code === item.code);
        const qty = parseInt(quantity);
        
        if (qty <= 0) {
            this.removeFromCart(index);
        } else if (qty <= product.stock) {
            item.quantity = qty;
            item.total = item.quantity * item.price;
            this.updateCartDisplay();
        } else {
            alert('Stok tidak mencukupi!');
            this.updateCartDisplay(); // Reset display
        }
    }

    removeFromCart(index) {
        this.cart.splice(index, 1);
        this.updateCartDisplay();
    }

    clearCart() {
        this.cart = [];
        this.updateCartDisplay();
        document.getElementById('cashReceived').value = '';
        document.getElementById('change').textContent = 'Rp 0';
    }

    updateCartSummary() {
        const subtotal = this.cart.reduce((sum, item) => sum + item.total, 0);
        const tax = subtotal * 0.1;
        const total = subtotal + tax;
        
        document.getElementById('subtotal').textContent = `Rp ${subtotal.toLocaleString('id-ID')}`;
        document.getElementById('tax').textContent = `Rp ${tax.toLocaleString('id-ID')}`;
        document.getElementById('total').textContent = `Rp ${total.toLocaleString('id-ID')}`;
        
        // Enable/disable payment button
        document.getElementById('processPayment').disabled = this.cart.length === 0;
        
        this.calculateChange();
    }

    togglePaymentDetails(method) {
        const cashPayment = document.getElementById('cashPayment');
        cashPayment.style.display = method === 'cash' ? 'block' : 'none';
    }

    calculateChange() {
        const total = this.cart.reduce((sum, item) => sum + item.total, 0) * 1.1;
        const cashReceived = parseFloat(document.getElementById('cashReceived').value) || 0;
        const change = cashReceived - total;
        
        document.getElementById('change').textContent = `Rp ${Math.max(0, change).toLocaleString('id-ID')}`;
        
        // Update payment button state for cash payments
        if (document.getElementById('paymentMethod').value === 'cash') {
            document.getElementById('processPayment').disabled = 
                this.cart.length === 0 || cashReceived < total;
        }
    }

    processPayment() {
        if (this.cart.length === 0) {
            alert('Keranjang kosong!');
            return;
        }
        
        const paymentMethod = document.getElementById('paymentMethod').value;
        const subtotal = this.cart.reduce((sum, item) => sum + item.total, 0);
        const tax = subtotal * 0.1;
        const total = subtotal + tax;
        
        let cashReceived = 0;
        let change = 0;
        
        if (paymentMethod === 'cash') {
            cashReceived = parseFloat(document.getElementById('cashReceived').value) || 0;
            if (cashReceived < total) {
                alert('Uang yang diterima kurang!');
                return;
            }
            change = cashReceived - total;
        }
        
        // Create transaction
        const transaction = {
            id: 'TRX' + Date.now(),
            date: new Date(),
            cashier: this.currentUser.name,
            items: [...this.cart],
            subtotal: subtotal,
            tax: tax,
            total: total,
            paymentMethod: paymentMethod,
            cashReceived: cashReceived,
            change: change
        };
        
        this.transactions.push(transaction);
        
        // Update stock
        this.cart.forEach(cartItem => {
            const product = this.products.find(p => p.code === cartItem.code);
            if (product) {
                product.stock -= cartItem.quantity;
            }
        });
        
        // Show receipt
        this.showReceipt(transaction);
        
        // Clear cart
        this.clearCart();
        this.displayProducts(); // Update product display with new stock
        this.displayProductsTable(); // Update products table
    }

    showReceipt(transaction) {
        const receiptContent = document.getElementById('receiptContent');
        const receiptDate = transaction.date.toLocaleString('id-ID');
        
        let receiptHTML = `
            <div class="receipt-header">
                <h3>Wanen Coffee & Eatery</h3>
                <p>Jl. Contoh No. 123</p>
                <p>@wanencoffee</p>
                <hr>
                <p>No: ${transaction.id}</p>
                <p>Tanggal: ${receiptDate}</p>
                <p>Kasir: ${transaction.cashier}</p>
                <hr>
            </div>
            <div class="receipt-items">
        `;
        
        transaction.items.forEach(item => {
            receiptHTML += `
                <div class="receipt-item">
                    <div>${item.name}</div>
                    <div></div>
                </div>
                <div class="receipt-item">
                    <div>${item.quantity} x ${item.price.toLocaleString('id-ID')}</div>
                    <div>${item.total.toLocaleString('id-ID')}</div>
                </div>
            `;
        });
        
        receiptHTML += `
            </div>
            <hr>
            <div class="receipt-item">
                <div>Subtotal:</div>
                <div>Rp ${transaction.subtotal.toLocaleString('id-ID')}</div>
            </div>
            <div class="receipt-item">
                <div>Pajak (10%):</div>
                <div>Rp ${transaction.tax.toLocaleString('id-ID')}</div>
            </div>
            <div class="receipt-item receipt-total">
                <div>TOTAL:</div>
                <div>Rp ${transaction.total.toLocaleString('id-ID')}</div>
            </div>
            <hr>
            <div class="receipt-item">
                <div>Pembayaran (${this.getPaymentMethodLabel(transaction.paymentMethod)}):</div>
                <div>Rp ${(transaction.cashReceived || transaction.total).toLocaleString('id-ID')}</div>
            </div>
        `;
        
        if (transaction.paymentMethod === 'cash' && transaction.change > 0) {
            receiptHTML += `
                <div class="receipt-item">
                    <div>Kembalian:</div>
                    <div>Rp ${transaction.change.toLocaleString('id-ID')}</div>
                </div>
            `;
        }
        
        receiptHTML += `
            <hr>
            <div style="text-align: center; margin-top: 1rem;">
                <p>Terima Kasih!</p>
                <p>Selamat Berbelanja Kembali</p>
            </div>
        `;
        
        receiptContent.innerHTML = receiptHTML;
        document.getElementById('receiptModal').classList.add('active');
    }

    getPaymentMethodLabel(method) {
        const labels = {
            'cash': 'Tunai',
            'card': 'Kartu',
            'ewallet': 'E-Wallet'
        };
        return labels[method] || method;
    }

    // Product Management
    displayProductsTable() {
        const tbody = document.querySelector('#productsTable tbody');
        tbody.innerHTML = '';
        
        this.products.forEach((product, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.code}</td>
                <td>${product.name}</td>
                <td>${product.category.charAt(0).toUpperCase() + product.category.slice(1)}</td>
                <td>Rp ${product.price.toLocaleString('id-ID')}</td>
                <td>${product.stock}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="posSystem.editProduct(${index})">Edit</button>
                    <button class="action-btn delete-btn" onclick="posSystem.deleteProduct(${index})">Hapus</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    openProductModal(productIndex = null) {
        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');
        const title = document.getElementById('modalTitle');
        
        if (productIndex !== null) {
            // Edit mode
            const product = this.products[productIndex];
            title.textContent = 'Edit Produk';
            document.getElementById('productCode').value = product.code;
            document.getElementById('productName').value = product.name;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productStock').value = product.stock;
            form.dataset.editIndex = productIndex;
        } else {
            // Add mode
            title.textContent = 'Tambah Produk';
            form.reset();
            delete form.dataset.editIndex;
        }
        
        modal.classList.add('active');
    }

    saveProduct() {
        const form = document.getElementById('productForm');
        const formData = new FormData(form);
        
        const product = {
            code: document.getElementById('productCode').value,
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            price: parseInt(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value)
        };
        
        // Validate unique code (except when editing same product)
        const editIndex = form.dataset.editIndex;
        const existingProduct = this.products.find((p, index) => 
            p.code === product.code && index != editIndex
        );
        
        if (existingProduct) {
            alert('Kode produk sudah ada!');
            return;
        }
        
        if (editIndex !== undefined) {
            // Edit existing product
            this.products[editIndex] = product;
        } else {
            // Add new product
            this.products.push(product);
        }
        
        this.displayProductsTable();
        this.displayProducts();
        this.loadCategoryFilter();
        this.closeProductModal();
    }

    editProduct(index) {
        this.openProductModal(index);
    }

    deleteProduct(index) {
        if (confirm('Yakin ingin menghapus produk ini?')) {
            this.products.splice(index, 1);
            this.displayProductsTable();
            this.displayProducts();
            this.loadCategoryFilter();
        }
    }

    closeProductModal() {
        document.getElementById('productModal').classList.remove('active');
    }

    // Reports
    generateReport() {
        const reportType = document.getElementById('reportType').value;
        const reportDate = new Date(document.getElementById('reportDate').value);
        
        let filteredTransactions = [];
        
        if (reportType === 'daily') {
            filteredTransactions = this.transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.toDateString() === reportDate.toDateString();
            });
        } else if (reportType === 'monthly') {
            filteredTransactions = this.transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.getMonth() === reportDate.getMonth() && 
                       transactionDate.getFullYear() === reportDate.getFullYear();
            });
        }
        
        this.displayReportSummary(filteredTransactions);
        this.displayTopProducts(filteredTransactions);
    }

    displayReportSummary(transactions) {
        const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
        const totalTransactions = transactions.length;
        const avgTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
        
        document.getElementById('totalSales').textContent = `Rp ${totalSales.toLocaleString('id-ID')}`;
        document.getElementById('totalTransactions').textContent = totalTransactions;
        document.getElementById('avgTransaction').textContent = `Rp ${avgTransaction.toLocaleString('id-ID')}`;
    }

    displayTopProducts(transactions) {
        const productSales = {};
        
        transactions.forEach(transaction => {
            transaction.items.forEach(item => {
                if (!productSales[item.code]) {
                    productSales[item.code] = {
                        name: item.name,
                        quantity: 0,
                        revenue: 0
                    };
                }
                productSales[item.code].quantity += item.quantity;
                productSales[item.code].revenue += item.total;
            });
        });
        
        const sortedProducts = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
        
        const tbody = document.querySelector('#topProductsTable tbody');
        tbody.innerHTML = '';
        
        sortedProducts.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name}</td>
                <td>${product.quantity}</td>
                <td>Rp ${product.revenue.toLocaleString('id-ID')}</td>
            `;
            tbody.appendChild(row);
        });
    }
}

// Global functions for onclick events
function closeProductModal() {
    posSystem.closeProductModal();
}

function closeReceiptModal() {
    document.getElementById('receiptModal').classList.remove('active');
}

function printReceipt() {
    const receiptContent = document.getElementById('receiptContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Receipt</title>
                <style>
                    body { font-family: 'Courier New', monospace; font-size: 12px; }
                    .receipt { max-width: 300px; margin: 0 auto; }
                    .receipt-item { display: flex; justify-content: space-between; }
                    .receipt-total { font-weight: bold; }
                    hr { border: none; border-top: 1px dashed #000; }
                </style>
            </head>
            <body>
                <div class="receipt">${receiptContent}</div>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Initialize the POS system
const posSystem = new POSSystem();