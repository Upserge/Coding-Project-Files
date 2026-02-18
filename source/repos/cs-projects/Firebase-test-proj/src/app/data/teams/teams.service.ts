import { inject, Injectable } from '@angular/core';import {
  Firestore,
  collection,
  addDoc,
  collectionData,
doc,
updateDoc,
deleteDoc
} from '@angular/fire/firestore';

export interface Team {
  id?: string;
  name: string;
  city: string;
}

@Injectable({ providedIn: 'root' })
export class TeamsService {
  private readonly firestore = inject(Firestore);
  private readonly teamsCol = collection(this.firestore, 'teams');

  // READ (live updates)
  getTeams$() {
    return collectionData(this.teamsCol, { idField: 'id' }) as any;
  }

  // CREATE
  addTeam(team: Omit<Team, 'id'>) {
    return addDoc(this.teamsCol, team) as any;
  }

  // UPDATE
  updateTEam(id: string, patch: Partial<Omit<Team, 'id'>>) {
    return updateDoc(doc(this.firestore, 'teams', id), patch);
  }

  // DELETE
  deleteTeam(id: string) {
    return deleteDoc(doc(this.firestore, 'teams', id));
  }
}
