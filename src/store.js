class Store {
  constructor() {
    this.token = localStorage.getItem('rental_token') || null;
    const savedUser = localStorage.getItem('rental_user');
    
    this.state = {
      user: savedUser ? JSON.parse(savedUser) : { name: 'John Doe', avatar: 'JD', id: null },
      currentRole: localStorage.getItem('rental_role') || 'Bachelor',
      properties: [],
      bookings: [],
      myListings: [],
      notifications: [],
      reviews: []
    };

    this.listeners = [];
    this.apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000/api' : '/api';
    this.init();
  }

  async init() {
    if (this.state.user && this.state.user.name) {
      const parts = this.state.user.name.split(' ');
      this.state.user.avatar = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
    }
    await this.fetchData();
  }

  get authHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
    };
  }

  async fetchData() {
    try {
      const [propsRes, bookingsRes, reviewsRes, notifsRes] = await Promise.all([
        fetch(`${this.apiUrl}/properties`),
        fetch(`${this.apiUrl}/bookings`),
        fetch(`${this.apiUrl}/reviews`),
        fetch(`${this.apiUrl}/notifications`)
      ]);

      this.state.properties = await propsRes.json();
      this.state.bookings = await bookingsRes.json();
      this.state.reviews = await reviewsRes.json();
      this.state.notifications = await notifsRes.json();
      
      this.notify();
    } catch (e) {
      console.error("Failed to fetch data from backend", e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  setRole(role) {
    this.state.currentRole = role;
    localStorage.setItem('rental_role', role);
    this.notify();
  }

  async login(email, password) {
    const res = await fetch(`${this.apiUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    this.token = data.token;
    localStorage.setItem('rental_token', data.token);
    
    const parts = data.user.name.split(' ');
    data.user.avatar = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
    
    localStorage.setItem('rental_user', JSON.stringify(data.user));
    localStorage.setItem('rental_logged_in', 'true');
    this.state.user = data.user;
    if(data.user.role) {
       this.setRole(data.user.role);
    }
    this.notify();
    return true;
  }

  async register(name, email, password, role) {
    const res = await fetch(`${this.apiUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    if (!res.ok) {
       let errMsg = 'Registration failed';
       try {
         const err = await res.json();
         errMsg = err.error || errMsg;
       } catch (e) {
         // If response is not JSON (e.g. Vercel 500 error page)
         errMsg = `Server error (${res.status}). Please try again.`;
       }
       throw new Error(errMsg);
    }
    return this.login(email, password);
  }

  logout() {
    this.token = null;
    localStorage.removeItem('rental_token');
    localStorage.removeItem('rental_user');
    localStorage.removeItem('rental_logged_in');
  }

  updateUserName(newName) {
    this.state.user.name = newName;
    const parts = newName.trim().split(' ');
    this.state.user.avatar = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
    this.notify();
  }

  async addBooking(propertyId) {
    const property = this.state.properties.find(p => p.id === propertyId);
    if(property) {
      // Optimistic update
      const tempId = Date.now();
      this.state.bookings.push({
        id: tempId,
        property,
        status: 'Pending',
        date: new Date().toLocaleDateString()
      });
      this.notify();

      // Backend call
      try {
        await fetch(`${this.apiUrl}/bookings`, {
          method: 'POST',
          headers: this.authHeaders,
          body: JSON.stringify({ propertyId })
        });
        await this.addNotification('Booking Requested', `Your request for ${property.title} has been sent.`, 'info');
        await this.fetchData(); // sync with db
      } catch (e) { console.error(e); }
      return true;
    }
    return false;
  }
  
  async updateBookingStatus(bookingId, status) {
    const booking = this.state.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.status = status;
      this.notify();

      try {
        await fetch(`${this.apiUrl}/bookings/${bookingId}`, {
          method: 'PATCH',
          headers: this.authHeaders,
          body: JSON.stringify({ status })
        });
        await this.addNotification('Booking Update', `Your request for ${booking.property.title} was ${status.toLowerCase()}.`, status === 'Accepted' ? 'success' : 'danger');
        await this.fetchData();
      } catch (e) { console.error(e); }
      return true;
    }
    return false;
  }

  async addReview(propertyId, rating, text) {
    try {
      await fetch(`${this.apiUrl}/reviews`, {
        method: 'POST',
        headers: this.authHeaders,
        body: JSON.stringify({
          propertyId,
          userName: this.state.user.name,
          avatar: this.state.user.avatar,
          rating: parseInt(rating),
          text
        })
      });
      await this.fetchData();
    } catch (e) { console.error(e); }
  }

  getReviews(propertyId) {
    return this.state.reviews.filter(r => r.propertyId === propertyId);
  }

  async addNotification(title, message, type = 'info') {
    try {
      await fetch(`${this.apiUrl}/notifications`, {
        method: 'POST',
        headers: this.authHeaders,
        body: JSON.stringify({ title, message, type })
      });
      await this.fetchData();
    } catch (e) { console.error(e); }
  }

  async markNotificationsRead() {
    this.state.notifications.forEach(n => n.read = true);
    this.notify();
    try {
      await fetch(`${this.apiUrl}/notifications/read`, { method: 'PATCH', headers: this.authHeaders });
      await this.fetchData();
    } catch (e) { console.error(e); }
  }

  async addProperty(propertyData) {
    const newProperty = {
      ...propertyData,
      ownerId: this.state.user.id || 'me'
    };
    
    // Optimistic
    this.state.properties.push({ id: Date.now(), ...newProperty });
    this.notify();

    try {
      await fetch(`${this.apiUrl}/properties`, {
        method: 'POST',
        headers: this.authHeaders,
        body: JSON.stringify(newProperty)
      });
      await this.fetchData();
    } catch (e) { console.error(e); }
  }

  async deleteProperty(propertyId) {
    // Optimistic delete
    this.state.properties = this.state.properties.filter(p => p.id !== propertyId);
    this.notify();

    try {
      await fetch(`${this.apiUrl}/properties/${propertyId}`, {
        method: 'DELETE',
        headers: this.authHeaders
      });
      await this.fetchData();
    } catch (e) { console.error(e); }
  }

  getFilteredProperties(filters = {}) {
    let props = this.state.properties;

    // Filter by target audience based on current role
    if (this.state.currentRole !== 'Property Owner') {
      props = props.filter(p => p.target && p.target.includes(this.state.currentRole));
    } else {
      props = props.filter(p => p.ownerId == this.state.user.id || p.ownerId === 'me'); // Show owner's own properties
    }

    return props;
  }
}

export const store = new Store();
