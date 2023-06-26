function toggleInactive(){
    const inactives = document.querySelectorAll(".inactive")
    inactives.forEach((obj) => {
        obj.style.display = obj.style.display === 'block' ? '' : 'block';
    });
}