import { Injectable } from '@angular/core';
import {Router} from '@angular/router'
import * as firebase from "firebase/app";
import { AngularFireAuth } from "@angular/fire/auth";
import {
  AngularFirestore,
  AngularFirestoreDocument
} from "@angular/fire/firestore";
import { Md5 } from "ts-md5/dist/md5";


import { Observable, of } from "rxjs";
import { switchMap, first } from "rxjs/operators";


interface User {
  uid:string;
  email:string;
  photoURL?: string;
  displayName?:string
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  user:Observable<User>;
  authState: firebase.User;

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router
  ) {
    this.user = this.afAuth.authState.pipe(
      switchMap(user => {
        this.authState = user;
        console.log("Firebase User Object: ", this.authState);
        if (user) {
          console.log("App User: ", this.user);
          return this.afs.doc<any>(`users/${user.uid}`).valueChanges();
        } else {
          return of(null);
        }
      })
    );


  }

  getUser() {
    return this.user.pipe(first()).toPromise();
  }

  get authenticated(): boolean {
    return this.authState !== null;
  }

  get currentUserId(): string {
    return this.authenticated ? this.authState.uid : null;
  }

  emailSignIn(email:string,password:string){
    return this.afAuth.auth.signInWithEmailAndPassword(email,password).then(()=>
    console.log("Signed in successfully")
    ).catch(error=> console.log(error.message))
  }

  signout() {
    return this.afAuth.auth.signOut().then(()=>{
      this.router.navigate(['/'])
    })
  }

  emailSignUp(email: string, password: string) {
    return this.afAuth.auth
      .createUserWithEmailAndPassword(email, password)
      .then(data => this.updateUserData(data.user))
      .then(() => console.log("Welcome, your account has been created!"))
      .then(() => {
        this.afAuth.auth.currentUser
          .sendEmailVerification()
          .then(() => console.log("We sent you an email verification"))
          .catch(error => console.log(error.message));
      })
      .catch(error => console.log(error.message));
  }
  resetPassword(email: string) {
    return firebase
      .auth()
      .sendPasswordResetEmail(email)
      .then(() => console.log(`We've sent you a password reset link`))
      .catch(error => console.log(error.message));
  }
  private updateUserData(user) {
    const userRef: AngularFirestoreDocument<User> = this.afs.doc(
      `users/${user.uid}`
    );
    const data: User = {
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName,
      photoURL:
        user.photoURL ||
        "https://www.gravatar.com/avatar/" +
          Md5.hashStr(user.uid) +
          "?d=identicon"
    };
    return userRef.set(data, { merge: true });
  }

  googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return this.socialLogin(provider);
  }

  githubLogin() {
    const provider = new firebase.auth.GithubAuthProvider();
    return this.socialLogin(provider);
  }
  facebookLogin() {
    const provider = new firebase.auth.FacebookAuthProvider();
    return this.socialLogin(provider);
  }
  twitterLogin() {
    const provider = new firebase.auth.TwitterAuthProvider();
    return this.socialLogin(provider);
  }

  private socialLogin(provider) {
    return this.afAuth.auth
      .signInWithPopup(provider)
      .then(credential => {
        this.updateUserData(credential.user);
      })
      .catch(error => console.log(error.message));
  }


}
