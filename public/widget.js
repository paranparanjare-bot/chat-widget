(function() {
    // KONFIGURASI
    // Saat deploy ke Render, ganti 'http://localhost:5173' dengan URL Render Anda
    // PENTING: Jangan lupa tambahkan '/embed' di akhir URL nanti jika di Render
    // Arahkan ke URL Render Anda
    const DOMAIN = 'https://betutu-chat-ai.onrender.com'; 
    const WIDGET_URL = DOMAIN + '/embed'; // Mengarah ke halaman khusus Chat Box
    
    // 1. Buat Container Chat
    const chatContainer = document.createElement('div');
    chatContainer.id = 'br-betutu-chat-widget';
    chatContainer.style.position = 'fixed';
    chatContainer.style.bottom = '20px';
    chatContainer.style.right = '20px';
    chatContainer.style.zIndex = '999999'; // Z-Index sangat tinggi agar di atas semua elemen
    chatContainer.style.fontFamily = "'Segoe UI', sans-serif";
    chatContainer.style.display = 'flex';
    chatContainer.style.flexDirection = 'column';
    chatContainer.style.alignItems = 'flex-end'; // Rata kanan
    
    // 2. Buat Iframe (Jendela Chat)
    const iframe = document.createElement('iframe');
    iframe.src = WIDGET_URL; 
    iframe.style.width = '350px';
    iframe.style.height = '500px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '15px';
    iframe.style.boxShadow = '0 5px 25px rgba(0,0,0,0.15)';
    iframe.style.marginBottom = '15px';
    // Animasi muncul
    iframe.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
    iframe.style.transformOrigin = 'bottom right';
    iframe.style.opacity = '0';
    iframe.style.transform = 'scale(0.5)';
    iframe.style.pointerEvents = 'none'; // Agar tidak menghalangi klik saat sembunyi
    iframe.style.position = 'absolute'; // Posisi absolute relative to container
    iframe.style.bottom = '70px'; // Di atas tombol
    iframe.style.right = '0';
    iframe.style.backgroundColor = '#fff';

    // Responsif Mobile
    if (window.innerWidth < 480) {
        iframe.style.width = 'calc(100vw - 40px)'; // Full width minus margin
        iframe.style.height = '70vh';
        iframe.style.right = '0';
    }

    // 3. Buat Tombol Bulat (Launcher)
    const button = document.createElement('div');
    // Icon Chat (SVG)
    const iconChat = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    // Icon Close (SVG)
    const iconClose = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    
    button.innerHTML = iconChat;
    button.style.width = '60px';
    button.style.height = '60px';
    button.style.backgroundColor = '#d4af37'; // Emas
    button.style.borderRadius = '50%';
    button.style.color = '#fff'; // Icon putih agar kontras
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 4px 15px rgba(212, 175, 55, 0.4)';
    button.style.transition = 'transform 0.3s ease, background-color 0.3s ease';
    button.style.position = 'relative';
    button.style.zIndex = '1000000';
    
    // Efek Hover
    button.onmouseover = () => button.style.transform = 'scale(1.1)';
    button.onmouseout = () => button.style.transform = 'scale(1)';

    // 4. Logika Buka/Tutup
    let isOpen = false;
    
    button.onclick = () => {
        isOpen = !isOpen;
        if (isOpen) {
            // TAMPILKAN CHAT
            iframe.style.opacity = '1';
            iframe.style.transform = 'scale(1)';
            iframe.style.pointerEvents = 'all';
            
            // Ubah Tombol jadi Merah (X)
            button.innerHTML = iconClose;
            button.style.backgroundColor = '#b91c1c'; 
            button.style.transform = 'rotate(90deg)'; // Efek putar
        } else {
            // SEMBUNYIKAN CHAT (Minimize)
            iframe.style.opacity = '0';
            iframe.style.transform = 'scale(0.5)';
            iframe.style.pointerEvents = 'none';
            
            // Balik ke Tombol Chat
            button.innerHTML = iconChat;
            button.style.backgroundColor = '#d4af37';
            button.style.transform = 'rotate(0deg)';
        }
    };

    // 5. Masukkan ke Halaman
    chatContainer.appendChild(iframe);
    chatContainer.appendChild(button);
    document.body.appendChild(chatContainer);

})();