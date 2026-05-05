/**
 * Drag and Drop Grid Sorting Logic
 * Handles the swapping of draggable cards based on HTML5 drag-and-drop.
 */
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('dragContainer');
    if (!container) return;

    let draggedItem = null;

    // We use a global binding function so dynamically added widgets can also be made draggable.
    window.makeDraggable = function(draggable) {
        // Prevent double binding
        if (draggable.dataset.dragBound === "true") return;
        draggable.dataset.dragBound = "true";

        // Default: NOT draggable. Only enable when user grabs the handle.
        draggable.setAttribute('draggable', 'false');

        // Enable drag ONLY when mousedown on the drag-handle (⋮⋮)
        const handle = draggable.querySelector('.drag-handle');
        if (handle) {
            handle.addEventListener('mousedown', () => {
                draggable.setAttribute('draggable', 'true');
            });
        }

        // Disable drag on mouseup anywhere on the card
        draggable.addEventListener('mouseup', () => {
            draggable.setAttribute('draggable', 'false');
        });

        // Drag Start
        draggable.addEventListener('dragstart', (e) => {
            draggedItem = draggable;
            setTimeout(() => {
                draggable.classList.add('dragging');
            }, 0);
        });

        // Drag End
        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
            const draggables = document.querySelectorAll('.draggable-card');
            draggables.forEach(card => card.classList.remove('drag-over'));
            draggedItem = null;
        });

        // Drag Enter / Over
        draggable.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessary to allow dropping
            if (draggedItem !== draggable && !draggable.classList.contains('add-widget-card')) {
                draggable.classList.add('drag-over');
            }
        });

        // Drag Leave
        draggable.addEventListener('dragleave', () => {
            draggable.classList.remove('drag-over');
        });

        // Drop
        draggable.addEventListener('drop', (e) => {
            e.preventDefault();
            draggable.classList.remove('drag-over');
            
            if (draggedItem && draggedItem !== draggable && !draggable.classList.contains('add-widget-card')) {
                swapNodes(draggedItem, draggable);
            }
        });
    };

    // Bind existing
    const draggables = document.querySelectorAll('.draggable-card');
    draggables.forEach(card => window.makeDraggable(card));

    /**
     * Swaps two DOM elements that have the same parent.
     */
    function swapNodes(node1, node2) {
        const parent = node1.parentNode;
        const sibling1 = node1.nextSibling === node2 ? node1 : node1.nextSibling;
        
        // Move node1 to node2's place
        parent.insertBefore(node1, node2);
        // Move node2 to node1's old place
        parent.insertBefore(node2, sibling1);
    }
});
