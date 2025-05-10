import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  UserCredential 
} from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, database } from './firebase';

export const registerUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  mobileNumber: string
) => {
  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Store additional user data in Realtime Database
    await set(ref(database, 'users/' + user.uid), {
      email: user.email,
      firstName,
      lastName,
      mobileNumber,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    });

    return { user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update last login time
    await set(ref(database, 'users/' + user.uid + '/lastLogin'), new Date().toISOString());

    return { user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}; 