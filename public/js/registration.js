import { db, collection, addDoc } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registration-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent form reload

    // Collect form data
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const branch = document.getElementById('branch').value;
    const semester = document.getElementById('semester').value;

    try {
      // Add data to Firestore
      await addDoc(collection(db, 'registrations'), {
        name,
        email,
        phone,
        branch,
        semester,
        timestamp: new Date()
      });

      alert('✅ Registration successful!');
      form.reset();

    } catch (error) {
      console.error('Error saving data: ', error);
      alert('❌ Registration failed. Please try again.');
    }
  });
});
