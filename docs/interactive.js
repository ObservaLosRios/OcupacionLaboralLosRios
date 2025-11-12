document.addEventListener('DOMContentLoaded', () => {
	const navLinks = Array.from(document.querySelectorAll('.nav-link'));
	const sections = Array.from(document.querySelectorAll('.section'));

	const activateSection = (targetId) => {
		sections.forEach((section) => {
			section.classList.toggle('active', section.id === targetId);
		});

		navLinks.forEach((link) => {
			link.classList.toggle('active', link.dataset.section === targetId);
		});

		if (typeof window.resizeCharts === 'function') {
			window.resizeCharts(targetId);
		}
	};

	navLinks.forEach((link) => {
		link.addEventListener('click', () => {
			const targetId = link.dataset.section;
			if (!targetId) {
				return;
			}

			activateSection(targetId);

			const targetSection = document.getElementById(targetId);
			if (targetSection) {
				const headerOffset = 120;
				const sectionTop = targetSection.getBoundingClientRect().top + window.pageYOffset;
				window.scrollTo({ top: sectionTop - headerOffset, behavior: 'smooth' });
			}
		});
	});

	/* Modal de configuración */
	const modal = document.getElementById('configModal');
	const closeBtn = modal ? modal.querySelector('.close') : null;
	const statusMessage = document.getElementById('status-message');

	const closeModal = () => {
		if (modal) {
			modal.style.display = 'none';
		}
	};

	window.openModal = () => {
		if (modal) {
			modal.style.display = 'block';
		}
	};

	if (closeBtn) {
		closeBtn.addEventListener('click', closeModal);
	}

	window.addEventListener('click', (event) => {
		if (event.target === modal) {
			closeModal();
		}
	});

	const showStatus = (message, type = 'info') => {
		if (!statusMessage) {
			return;
		}

		statusMessage.textContent = message;
		statusMessage.className = `status-message status-${type}`;
	};

	window.applyConfiguration = () => {
		showStatus('Esta plantilla ahora integra visualizaciones pre-renderizadas. Personaliza el contenido editando los archivos HTML individuales.', 'info');
	};

	window.loadExampleData = () => {
		showStatus('La carga de datos de ejemplo no está disponible en esta integración. Utiliza las visualizaciones incrustadas.', 'info');
	};
});
