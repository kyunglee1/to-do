
const container = document.getElementById('container');
let editing = true;
let storageArray = ['skip'];

loadPanes();

container.addEventListener('click', addItem);
container.addEventListener('click', editItem);
container.addEventListener('click', removeItem);
container.addEventListener('click', toggleEdit);
container.addEventListener('change', updateStorage);
container.addEventListener('change', managePanes);
container.addEventListener('pointerdown', initiateDrag);

function loadPanes() {
  if(localStorage.getItem('panes')) {
    storageArray = JSON.parse(localStorage.getItem('panes'));
    
    for(const value of storageArray) {
      // Pane #'s start at 1
      if(storageArray.indexOf(value) == 0) { continue; }
      const pane = document.querySelector('.pane').cloneNode(true);
      const paneText = pane.querySelector('.edit');
      const addButton = pane.querySelector('.edit-add');
      const dragButton = pane.querySelector('.edit-drag');

      paneText.innerHTML = value;
      container.lastElementChild.before(pane);
      hide(addButton);
      show(dragButton);
      addColor(pane);
    }
  }
}

function addItem(event) {
  const addButton = event.target.closest('.edit-add');
  if(!addButton) {
    return; 
  } 
  const paneText = addButton.closest('.pane').querySelector('.edit');
  const dragButton = addButton.closest('.pane').querySelector('.edit-drag');
  const editArea = document.createElement('textarea');

  editArea.value = '';
  paneText.innerHTML = '';
  paneText.append(editArea);
  editArea.focus();
  hide(addButton); 
  show(dragButton);

  document.addEventListener('keydown', saveEdit);
  editArea.addEventListener('blur', saveEdit);
}

function editItem(event) {
  const paneText = event.target.closest('.edit'); 
  const defaultValue = '<i>Add something...</i>';
 
  if(!paneText) {
    return;
  }
  if(paneText.innerHTML.includes(defaultValue)) {
    return;
  }
  if(paneText.querySelector('textarea')) {
    return;
  }

  const editArea = document.createElement('textarea');
  editArea.style.height = paneText.offsetHeight + 'px';
  editArea.value = paneText.innerHTML;
  paneText.innerHTML = '';
  paneText.append(editArea);
  editArea.focus();

  document.addEventListener('keydown', saveEdit);
  editArea.addEventListener('blur', saveEdit);
} 

function saveEdit(event) {
  if(event.code && event.code != 'Enter') {
    return;
  }
  const editArea = container.querySelector('textarea');
  const paneText = editArea.closest('.edit');
  const pane = paneText.closest('.pane');
  
  editArea.value = editArea.value.trim();
  paneText.innerHTML = editArea.value;
  editArea.remove();
  addColor(pane);

  if(!editArea.value) {
    const dragButton = paneText.closest('.pane').querySelector('.edit-drag');
    const addButton = paneText.closest('.pane').querySelector('.edit-add');
    const defaultValue = '<i>Add something...</i>'
   
    hide(dragButton);
    show(addButton);
    paneText.innerHTML = defaultValue;
    removeColor(pane);
  }
  document.removeEventListener('keydown', saveEdit);
  editArea.removeEventListener('blur', saveEdit);
} 

function removeItem(event) {
  const removeButton = event.target.closest('.edit-remove');
  if(!removeButton) {
    return;
  }
  const confirmWindow = document.getElementById('confirm-remove');
  const modal = document.getElementById('modal');
  const confirmButton = document.getElementById('confirm');
  const rejectButton = document.getElementById('reject');

  show(confirmWindow);
  show(modal);
  
  confirmButton.onclick = () => {
    const paneNumber = getPaneNumber(event.target);
    removeCurrentPane.call(event.target);
    storageArray.splice(paneNumber, 1);
    localStorage.setItem('panes', JSON.stringify(storageArray));
    hide(confirmWindow);
    hide(modal);
  };
  
  rejectButton.onclick = () => {
    hide(confirmWindow);
    hide(modal);
  };
}

function toggleEdit(event) {
  const editButton = event.target.closest('#toggle-edit');
  if(!editButton) {
    return;
  }
  const defaultPane = container.lastElementChild;

  if(editing) {
    for(const button of container.querySelectorAll('button')) {
      if(button.id == 'toggle-edit') { continue; }
      if(button.closest('.pane') == defaultPane) { continue; }
      if(button.className == 'edit-remove') {
        show(button); 
        continue; 
      }
      hide(button);
    }
    hide(defaultPane);
    editButton.innerHTML = '<span>Done</span>'; 
    editing = false;
  }
  else {
    for(const button of container.querySelectorAll('button')) {
      if(button.id == 'toggle-edit') { continue; }
      if(button.closest('.pane') == defaultPane) { continue; }
      if(button.className == 'edit-drag') {
        show(button);
        continue;
      }
      hide(button);
    }
    show(defaultPane, true);
    editButton.innerHTML = '<span>Edit</span>';
    editing = true;
  }
}

function updateStorage(event) {
  if(event.target.tagName != 'TEXTAREA') {
    return;
  }
  const editArea = event.target;
  const paneNumber = getPaneNumber(editArea);
  editArea.value = editArea.value.trim();
  
  if(editArea.value) { // New value, replace old 
    storageArray[paneNumber] ? storageArray.splice(paneNumber, 1, editArea.value) : storageArray.push(editArea.value);
  }
  else { // No value, remove old
    storageArray.splice(paneNumber, 1);
  }
  localStorage.setItem('panes', JSON.stringify(storageArray));
}

function managePanes(event) {
  if(event.target.tagName != 'TEXTAREA') {
    return;
  }
  const editArea = event.target;
  const nextPane = editArea.closest('.pane').nextElementSibling;
  const previousPane = editArea.closest('.pane').previousElementSibling;
  
  editArea.value = editArea.value.trim();

  if(editArea.value && !nextPane) {
    displayNewPane();
  }
  if(!editArea.value && previousPane) {
    removeCurrentPane.call(editArea);
  }
  if(!editArea.value && nextPane) {
    removeCurrentPane.call(editArea);
  }
}

function initiateDrag(event) {
  const dragButton = event.target.closest('.edit-drag');
  if(!dragButton) {
    return;
  }
  event.preventDefault();
  const defaultPane = container.lastElementChild;
  const pane = dragButton.closest('.pane');
  const shiftY = event.clientY - dragButton.getBoundingClientRect().top;
  let paneAbove, paneBelow;
  // Default pane should not drag
  if(pane == defaultPane) {
    return;
  }
  // Set up drag for pointermove
  dragButton.setPointerCapture(event.pointerId);
  defaultPane.remove();
  paneBelow = pane.nextElementSibling;
  paneAbove = pane.previousElementSibling.closest('.pane');
  pane.classList.add('dragging');

  const topCoordinates = ['skip'];
  for(const pane of container.querySelectorAll('.pane')) {
    topCoordinates.push(pane.getBoundingClientRect().top);
  }

  moveTo(event.clientY);
  dragButton.addEventListener('pointermove', dragPane);
  dragButton.addEventListener('pointermove', manageDrag);
  dragButton.addEventListener('pointerup', dropPane);

  function moveTo(clientY) {
    let top = clientY - shiftY - container.getBoundingClientRect().top - dragButton.clientHeight;

    if(top < 0) {
      top = 0;
    }
    if(top > container.clientHeight - pane.offsetHeight) {
      top = container.clientHeight - pane.offsetHeight + 'px';
    } 
    pane.style.top = top + 'px';
  }

  function dragPane(event) {
    moveTo(event.clientY);
  }

  function manageDrag() {
    const top = pane.getBoundingClientRect().top;
    const dropArea = document.getElementById('drop-area');

    if(paneAbove && top < topCoordinates[getPaneNumber(paneAbove)]) {

      paneBelow = paneAbove;
      paneAbove = paneAbove.previousElementSibling;
      if(paneAbove == pane) {
        paneAbove = paneAbove.previousElementSibling;
      }
      show(dropArea);
      dropArea.style.top = paneBelow.getBoundingClientRect().top - dropArea.offsetHeight + 'px';
      dropArea.style.left = paneBelow.getBoundingClientRect().left + 'px';
    }

    else if(paneBelow && top > topCoordinates[getPaneNumber(paneBelow)]) {

      paneAbove = paneBelow;
      paneBelow = paneBelow.nextElementSibling;
      if(paneBelow == pane) {
        paneBelow = paneBelow.nextElementSibling;
      }
      show(dropArea);
      dropArea.style.top = paneAbove.getBoundingClientRect().bottom + 'px';
      dropArea.style.left = paneAbove.getBoundingClientRect().left + 'px';
    }
  }

  function dropPane(event) {
    const dropArea = document.getElementById('drop-area');
    const paneText = pane.lastElementChild.innerHTML;

    pane.classList.remove('dragging');
    hide(dropArea);
    container.append(defaultPane);
    storageArray.splice(getPaneNumber(pane), 1);

    if(paneBelow) {
      paneBelow.before(pane);
      storageArray.splice(getPaneNumber(pane), 0, paneText);
      localStorage.setItem('panes', JSON.stringify(storageArray));
    }
    else if(paneAbove) {
      paneAbove.after(pane);
      storageArray.splice(getPaneNumber(pane), 0, paneText);
      localStorage.setItem('panes', JSON.stringify(storageArray));
    }
    else {
      storageArray.push(paneText);
    }
    dragButton.removeEventListener('pointermove', dragPane);
    dragButton.removeEventListener('pointermove', manageDrag);
    dragButton.removeEventListener('pointerup', dropPane);
  }
}

function getPaneNumber(elem) {
  let pane = elem.closest('.pane');
  let paneNumber = -1;
  
  while(pane) {
    paneNumber++;
    pane = pane.previousElementSibling;
  }
  pane = null;
  return paneNumber;
}

function displayNewPane() { 
  const pane = document.createElement('div');
  pane.className = 'pane';
  pane.innerHTML = `<button class="edit-remove"><span>X</span></button>
                    <button class="edit-drag"><span>=</span></button>
                    <button class="edit-add"><span>+</span></button>
                    <div class="edit"><i>Add something...</i></div>`;
  container.append(pane);
}

function removeCurrentPane() {
  const pane = this.closest('.pane');
  pane.remove();
}

function show(elem, isPane) {
  elem.style.display = 'block';
  if(isPane) {
      elem.style.display = 'flex';
  }
}

function hide(elem) {
  elem.style.display = 'none';
}

function addColor(elem) {
  elem.style.border = '2px solid blue';
  elem.style.backgroundColor = 'white';
  elem.style.borderRadius = '15px';
}

function removeColor(elem) {
  elem.style.border = elem.style.backgroundColor = '';
}