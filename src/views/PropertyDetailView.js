import { store } from '../store.js';

export function renderPropertyDetailView(container, propertyId) {
  const property = store.state.properties.find(p => p.id === propertyId) || store.state.properties[0];
  const isOwner = store.state.currentRole === 'Property Owner';

  const hasBooked = store.state.bookings.some(b => b.property.id === property.id);
  const reviews = store.getReviews(property.id);
  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 'New';

  container.innerHTML = `
    <div style="position: relative; height: 100%; overflow-y: auto;">
      <!-- Header Image & Back button -->
      <div style="position: relative; height: 35vh;">
        <img src="${property.image}" style="width: 100%; height: 100%; object-fit: cover;">
        <div style="position: absolute; top: 0; left: 0; right: 0; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent);">
          <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer;" onclick="window.history.back() || window.navigateTo('/home')">
            <i class="fas fa-arrow-left"></i>
          </div>
          <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer;">
            <i class="far fa-heart"></i>
          </div>
        </div>
        <div style="position: absolute; bottom: -20px; right: 1.5rem; background: var(--primary); color: white; padding: 0.5rem 1.5rem; border-radius: var(--border-radius-full); font-weight: 700; font-size: 1.25rem; box-shadow: var(--shadow-md);">
          $${property.price}<span style="font-size:0.8rem; font-weight:400">/mo</span>
        </div>
      </div>

      <!-- Content -->
      <div style="padding: 2rem 1.5rem; padding-bottom: 6rem; background: var(--bg-color); border-radius: 2rem 2rem 0 0; position: relative; top: -20px; min-height: 70vh;">
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
          <span class="badge badge-primary">${property.type}</span>
          ${property.target.map(t => `<span class="badge badge-success">${t}</span>`).join('')}
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <h1 style="font-size: 1.75rem; line-height: 1.2; margin: 0;">${property.title}</h1>
          <div style="display: flex; align-items: center; gap: 0.25rem; background: var(--primary-light); padding: 0.25rem 0.5rem; border-radius: var(--border-radius-sm); color: white; font-weight: bold;">
            <i class="fas fa-star" style="font-size: 0.8rem;"></i> ${avgRating}
          </div>
        </div>
        <p style="color: var(--text-light); display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem;">
          <i class="fas fa-map-marker-alt text-primary"></i> ${property.location} (${property.distance})
        </p>

        <!-- Stats -->
        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--glass-border); border-bottom: 1px solid var(--glass-border); padding: 1rem 0; margin: 1.5rem 0;">
           <div style="text-align: center;">
             <i class="fas fa-bed" style="color: var(--primary); font-size: 1.25rem; margin-bottom: 0.25rem;"></i>
             <div style="font-size: 0.85rem; font-weight: 600;">2 Beds</div>
           </div>
           <div style="text-align: center;">
             <i class="fas fa-bath" style="color: var(--primary); font-size: 1.25rem; margin-bottom: 0.25rem;"></i>
             <div style="font-size: 0.85rem; font-weight: 600;">2 Baths</div>
           </div>
           <div style="text-align: center;">
             <i class="fas fa-vector-square" style="color: var(--primary); font-size: 1.25rem; margin-bottom: 0.25rem;"></i>
             <div style="font-size: 0.85rem; font-weight: 600;">1200 sqft</div>
           </div>
        </div>

        <!-- Description -->
        <h3 style="margin-bottom: 0.75rem;">Description</h3>
        <p style="font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem;">
          This beautiful ${property.type.toLowerCase()} offers a perfect blend of comfort and convenience. Located in the heart of ${property.location}, it features modern amenities and a spacious layout ideal for ${property.target.join(' or ')}.
        </p>

        <!-- Amenities -->
        <h3 style="margin-bottom: 0.75rem;">Amenities</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.5rem;">
          ${property.amenities && property.amenities.length > 0 ? property.amenities.map(a => `
            <div style="background: var(--card-bg); border: 1px solid var(--glass-border); padding: 0.5rem 1rem; border-radius: var(--border-radius-full); font-size: 0.85rem; font-weight: 500; display: flex; align-items: center; gap: 0.5rem;">
              <i class="fas fa-check-circle" style="color: var(--secondary)"></i> ${a}
            </div>
          `).join('') : '<p>No specific amenities listed.</p>'}
        </div>

        <!-- Map Location -->
        <h3 style="margin-bottom: 0.75rem;">Location</h3>
        <div class="map-container" style="height: 150px; border-radius: var(--border-radius-md);">
          <div class="map-pin" style="top: 50%; left: 50%;"></div>
        </div>
        
        <!-- Owner Info -->
        <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--card-bg); border-radius: var(--border-radius-lg); margin-top: 1.5rem; border: 1px solid var(--glass-border);">
          <div style="width: 50px; height: 50px; background: var(--primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700;">
            ${property.ownerId === 'me' ? store.state.user.avatar : 'OW'}
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 600;">${property.ownerId === 'me' ? store.state.user.name : 'Property Owner'}</div>
            <div style="font-size: 0.8rem; color: var(--text-light);">Member since 2024</div>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <div style="width: 36px; height: 36px; background: rgba(79, 70, 229, 0.1); color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;"><i class="fas fa-comment"></i></div>
            <div style="width: 36px; height: 36px; background: rgba(16, 185, 129, 0.1); color: var(--secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;"><i class="fas fa-phone"></i></div>
          </div>
        </div>

        <!-- Reviews & Ratings -->
        <h3 style="margin-top: 2rem; margin-bottom: 0.75rem;">Reviews (${reviews.length})</h3>
        <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
          ${reviews.length > 0 ? reviews.map(r => `
            <div class="glass-panel" style="padding: 1rem; border-radius: var(--border-radius-md);">
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                  <div style="width: 30px; height: 30px; background: var(--secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.7rem; font-weight: 700;">
                    ${r.avatar}
                  </div>
                  <strong>${r.userName}</strong>
                </div>
                <div style="color: #fbbf24; font-size: 0.8rem;">
                  ${Array(5).fill(0).map((_, i) => `<i class="fas fa-star" style="opacity: ${i < r.rating ? 1 : 0.3}"></i>`).join('')}
                </div>
              </div>
              <p style="font-size: 0.85rem; color: var(--text-light); margin: 0;">${r.text}</p>
            </div>
          `).join('') : '<p style="font-size: 0.85rem; color: var(--text-light);">No reviews yet. Be the first to review!</p>'}
        </div>

        ${!isOwner ? `
          <div class="glass-panel" style="padding: 1rem; border-radius: var(--border-radius-md);">
            <h4 style="margin-bottom: 0.5rem; margin-top: 0;">Leave a Review</h4>
            <form id="review-form" style="display: flex; flex-direction: column; gap: 0.5rem;">
              <select id="review-rating" class="input-field" style="padding: 0.5rem; background: var(--card-bg); border: 1px solid var(--glass-border); border-radius: var(--border-radius-sm); color: var(--text-color);" required>
                <option value="" disabled selected>Select Rating</option>
                <option value="5">5 Stars - Excellent</option>
                <option value="4">4 Stars - Good</option>
                <option value="3">3 Stars - Average</option>
                <option value="2">2 Stars - Poor</option>
                <option value="1">1 Star - Terrible</option>
              </select>
              <textarea id="review-text" class="input-field" placeholder="Write your review here..." rows="3" required style="resize: vertical; padding: 0.5rem; background: var(--card-bg); border: 1px solid var(--glass-border); border-radius: var(--border-radius-sm); color: var(--text-color);"></textarea>
              <button type="submit" class="btn btn-primary" style="padding: 0.5rem;">Submit Review</button>
            </form>
          </div>
        ` : ''}

      </div>

      <!-- Action Bar -->
      <div style="position: fixed; bottom: 0; left: 0; right: 0; padding: 1rem 1.5rem; background: var(--bg-color); border-top: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; z-index: 100; padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0));">
        <div>
           <div style="font-size: 0.8rem; color: var(--text-light);">Total Price</div>
           <div style="font-weight: 700; font-size: 1.25rem; color: var(--primary);">$${property.price}</div>
        </div>
        ${!isOwner ? `
          <button id="book-btn" class="btn ${hasBooked ? 'btn-secondary' : 'btn-primary'}" style="width: 60%;" ${hasBooked ? 'disabled' : ''}>
            ${hasBooked ? 'Request Sent' : 'Book Now'}
          </button>
        ` : `
          <button class="btn btn-outline" style="width: 60%;" onclick="alert('Edit Listing')">
            <i class="fas fa-edit"></i> Edit Listing
          </button>
        `}
      </div>
    </div>
  `;

  if (!isOwner && !hasBooked) {
    const bookBtn = document.getElementById('book-btn');
    if (bookBtn) {
      bookBtn.addEventListener('click', () => {
        store.addBooking(property.id);
        bookBtn.classList.remove('btn-primary');
        bookBtn.classList.add('btn-secondary');
        bookBtn.innerText = 'Request Sent';
        bookBtn.disabled = true;
        // Navigation re-render not strictly needed here since state changed, but let's re-render to update badges
        window.navigateTo('/property-detail', property.id);
      });
    }
  }

  // Review form submission
  if (!isOwner) {
    // Add small delay to ensure DOM is ready
    setTimeout(() => {
      const reviewForm = document.getElementById('review-form');
      if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const rating = document.getElementById('review-rating').value;
          const text = document.getElementById('review-text').value;
          if (rating && text) {
            store.addReview(property.id, rating, text);
            // Re-render the view to show the new review
            window.navigateTo('/property-detail', property.id);
          }
        });
      }
    }, 0);
  }
}
