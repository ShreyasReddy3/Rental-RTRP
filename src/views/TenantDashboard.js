import { store } from '../store.js';

export function renderTenantDashboard(container, isSearch = false) {
  const properties = store.getFilteredProperties();
  
  // Header Greeting
  let html = `
    <div class="view-content">
      ${!isSearch ? `
        <div style="margin-bottom: 2rem;">
          <p style="color: var(--text-light); margin-bottom: 0.25rem;">Location</p>
          <h2 style="display: flex; align-items: center; gap: 0.5rem; margin: 0;">
            <i class="fas fa-map-marker-alt text-primary" style="color: var(--primary)"></i> 
            Silicon Valley, CA <i class="fas fa-chevron-down" style="font-size: 0.8rem; color: var(--text-light)"></i>
          </h2>
        </div>
      ` : `
        <div style="margin-bottom: 1.5rem;">
          <div class="input-group" style="margin-bottom: 1rem;">
            <i class="fas fa-search"></i>
            <input type="text" class="input-field" placeholder="Search by location, price, or amenities...">
            <div style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); background: var(--primary); padding: 0.5rem; border-radius: 50%; color: white; display:flex; align-items:center; justify-content:center; width:32px; height:32px; cursor:pointer;" onclick="document.getElementById('filter-modal').classList.add('active')">
              <i class="fas fa-sliders-h" style="position:static; transform:none; color:white;"></i>
            </div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
             <h3 style="margin:0">${properties.length} Results Found</h3>
             <div class="toggle-container" style="margin:0">
               <span style="font-size:0.85rem; font-weight:600">Map</span>
               <label class="switch" style="transform: scale(0.8)">
                 <input type="checkbox" id="map-toggle" ${isSearch ? 'checked' : ''}>
                 <span class="slider"></span>
               </label>
             </div>
          </div>
        </div>
      `}
      
      <!-- Interactive Map Mock -->
      <div id="map-view" style="display: ${isSearch ? 'block' : 'none'};">
        <div class="map-container glass-panel">
          ${properties.map((p, i) => `
            <div class="map-pin" style="top: ${20 + (i * 25)}%; left: ${30 + (i * 30)}%;" data-id="${p.id}"></div>
          `).join('')}
          <div style="position: absolute; bottom: 1rem; right: 1rem; display:flex; flex-direction:column; gap:0.5rem;">
             <div style="background:var(--card-bg); width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-md); cursor:pointer;"><i class="fas fa-crosshairs"></i></div>
             <div style="background:var(--card-bg); width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-md); cursor:pointer;"><i class="fas fa-plus"></i></div>
             <div style="background:var(--card-bg); width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-md); cursor:pointer;"><i class="fas fa-minus"></i></div>
          </div>
        </div>
      </div>

      <!-- Categories / Quick Filters -->
      ${!isSearch ? `
        <div style="display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1rem; margin-bottom: 1rem; scrollbar-width: none;">
          <div style="display:flex; flex-direction:column; align-items:center; gap:0.5rem; min-width: 70px;">
            <div style="width: 60px; height: 60px; border-radius: var(--border-radius-full); background: rgba(79, 70, 229, 0.1); display:flex; align-items:center; justify-content:center; color: var(--primary); font-size: 1.5rem;"><i class="fas fa-building"></i></div>
            <span style="font-size:0.8rem; font-weight:600">Apartments</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:0.5rem; min-width: 70px;">
            <div style="width: 60px; height: 60px; border-radius: var(--border-radius-full); background: var(--card-bg); display:flex; align-items:center; justify-content:center; color: var(--text-main); font-size: 1.5rem; box-shadow: var(--shadow-sm);"><i class="fas fa-home"></i></div>
            <span style="font-size:0.8rem; font-weight:600">Houses</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:0.5rem; min-width: 70px;">
            <div style="width: 60px; height: 60px; border-radius: var(--border-radius-full); background: var(--card-bg); display:flex; align-items:center; justify-content:center; color: var(--text-main); font-size: 1.5rem; box-shadow: var(--shadow-sm);"><i class="fas fa-store"></i></div>
            <span style="font-size:0.8rem; font-weight:600">Shops</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:0.5rem; min-width: 70px;">
            <div style="width: 60px; height: 60px; border-radius: var(--border-radius-full); background: var(--card-bg); display:flex; align-items:center; justify-content:center; color: var(--text-main); font-size: 1.5rem; box-shadow: var(--shadow-sm);"><i class="fas fa-building"></i></div>
            <span style="font-size:0.8rem; font-weight:600">Offices</span>
          </div>
        </div>
      ` : ''}

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="margin: 0;">${isSearch ? 'Featured Properties' : 'Recommended for You'}</h3>
        ${!isSearch ? `<a href="#" style="color: var(--primary); text-decoration: none; font-size: 0.9rem; font-weight: 600;" onclick="window.navigateTo('/search')">See All</a>` : ''}
      </div>

      <!-- Properties List -->
      <div id="list-view" style="display: ${isSearch ? 'none' : 'block'};">
        ${properties.length > 0 ? properties.map(p => `
          <div class="property-card glass-panel" onclick="window.navigateTo('/property-detail', ${p.id})">
            <div style="position: relative;">
              <img src="${p.image}" class="property-img" alt="${p.title}">
              <div style="position: absolute; top: 1rem; right: 1rem; background: rgba(255,255,255,0.9); width: 35px; height: 35px; border-radius: 50%; display:flex; align-items:center; justify-content:center; color: var(--danger); box-shadow: var(--shadow-sm);">
                <i class="far fa-heart"></i>
              </div>
              <div style="position: absolute; bottom: 1rem; left: 1rem; background: rgba(0,0,0,0.6); color: white; padding: 0.25rem 0.75rem; border-radius: var(--border-radius-full); font-size: 0.8rem; backdrop-filter: blur(4px);">
                ${p.type}
              </div>
            </div>
            <div class="property-info">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
                <div class="property-title">${p.title}</div>
                <div class="property-price">$${p.price}<span style="font-size:0.8rem; color:var(--text-light); font-weight:400">/mo</span></div>
              </div>
              <div class="property-meta">
                <span><i class="fas fa-map-marker-alt text-primary"></i> ${p.location}</span>
                <span><i class="fas fa-location-arrow text-primary"></i> ${p.distance}</span>
              </div>
            </div>
          </div>
        `).join('') : `
          <div style="text-align:center; padding: 3rem 1rem; color: var(--text-light)">
            <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5"></i>
            <h3>No Properties Found</h3>
            <p>Try adjusting your search criteria or switching roles.</p>
          </div>
        `}
      </div>
    </div>
  `;

  // Filter Modal Content
  const modalContainer = document.getElementById('modal-container');
  if(modalContainer) {
    modalContainer.innerHTML = `
      <div class="modal-overlay" id="filter-modal">
        <div class="modal-content">
          <div class="modal-handle"></div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
             <h2 style="margin:0">Filters</h2>
             <i class="fas fa-times" style="font-size:1.5rem; color:var(--text-light); cursor:pointer;" onclick="document.getElementById('filter-modal').classList.remove('active')"></i>
          </div>
          
          <div style="margin-bottom: 1.5rem;">
             <h3 style="margin-bottom: 0.5rem; font-size: 1.1rem;">Price Range</h3>
             <input type="range" style="width:100%; margin-bottom:0.5rem;" min="0" max="10000" value="5000">
             <div style="display:flex; justify-content:space-between; color:var(--text-light); font-size:0.9rem;">
                <span>$0</span>
                <span>$10,000+</span>
             </div>
          </div>
          
          <div style="margin-bottom: 1.5rem;">
             <h3 style="margin-bottom: 0.5rem; font-size: 1.1rem;">Property Type</h3>
             <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
               <span class="badge" style="border: 1px solid var(--primary); color: var(--primary); padding: 0.5rem 1rem; font-size: 0.9rem;">Room</span>
               <span class="badge badge-primary" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Apartment</span>
               <span class="badge" style="border: 1px solid var(--primary); color: var(--primary); padding: 0.5rem 1rem; font-size: 0.9rem;">House</span>
               <span class="badge" style="border: 1px solid var(--primary); color: var(--primary); padding: 0.5rem 1rem; font-size: 0.9rem;">Shop</span>
             </div>
          </div>
          
          <button class="btn btn-primary" onclick="document.getElementById('filter-modal').classList.remove('active')">Apply Filters</button>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  // Event Listeners for Map Toggle
  const mapToggle = document.getElementById('map-toggle');
  if (mapToggle) {
    mapToggle.addEventListener('change', (e) => {
      document.getElementById('map-view').style.display = e.target.checked ? 'block' : 'none';
      document.getElementById('list-view').style.display = e.target.checked ? 'none' : 'block';
    });
  }
  
  // Map Pin Listeners
  const pins = container.querySelectorAll('.map-pin');
  pins.forEach(pin => {
    pin.addEventListener('click', (e) => {
       const id = e.target.getAttribute('data-id');
       if(id) window.navigateTo('/property-detail', parseInt(id));
    });
  });
}
