import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Firestore, collection, query, where, getDocs, doc, getDoc,deleteDoc } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { updateDoc, arrayUnion } from '@angular/fire/firestore';

@Component({
  selector: 'app-characters',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, RouterModule],
  templateUrl: './characters.component.html',
  styleUrls: ['./characters.component.scss']
})
export class CharactersComponent implements OnInit {
  characters: any[] = [];
  userId: string | null = null;
  campaignId: string | null = null;
  showLeavePopup = false;
  id='';
  

  constructor(
    private firestore: Firestore,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    this.userId = await this.auth.getUserId();
    const campaignId = this.route.snapshot.paramMap.get('id');

    if (this.userId) {
      await this.loadCharacters(this.userId);
    }

    if (campaignId) {
      this.campaignId = campaignId;
    }
}

  async loadCharacters(userId: string) {
    const characterRef = collection(this.firestore, 'character');
    const q = query(characterRef, where('userId', '==', userId));
    const snap = await getDocs(q);

    const results = [];

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const className = await this.getNameFromId('class', data['class']);
      const raceName = await this.getNameFromId('race', data['race']);

      results.push({
        id: docSnap.id,
        name: data['appearance']?.name || 'Névtelen Hős',
        class: className || 'Ismeretlen kaszt',
        race: raceName || 'Ismeretlen faj',
        campaign:data['campaign'],
      });
    }

    this.characters = results;
  }
  async getNameFromId(collectionName: string, id: string): Promise<string | null> {
    try {
      const docRef = doc(this.firestore, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data['name']; 
      }
    } catch (error) {
    }
    return null;
  }
  async joinCampaign(characterId: string) {
    if (!this.campaignId) return;
    try {
      const campaignRef = doc(this.firestore, `campaigns/${this.campaignId}`);
      await updateDoc(campaignRef, {
        characterIds: arrayUnion(characterId)
      });
      const characterRef = doc(this.firestore, `character/${characterId}`);
      await updateDoc(characterRef, {
        campaign: true
      });
      alert('A karakter sikeresen csatlakozott a kampányhoz!');
    } catch (error) {
      alert('Hiba történt a csatlakozáskor.');
    }
    this.router.navigate(['/characters'])
  }
  openCharacter(id: string) {
    this.router.navigate(['/character-sheet', id]);
  }
  openCharacterCreate(){
    this.router.navigate(['/charactercreate']);
  }
  async deleteCharacter() {
    if (!this.id) return;
  
    try {
      const campaignRef = doc(this.firestore, 'character', this.id);
      await deleteDoc(campaignRef);
      this.showLeavePopup=false;
      // Sikeres törlés -> vissza a karakterekhez listához
      this.router.navigate(['/characters']);
      this.userId = await this.auth.getUserId();
      if (this.userId) {
        await this.loadCharacters(this.userId);
      }
    } catch (err) {
      alert("Hiba történt a törlés során!");
    }
  }
    saveId(id:string){
      this.id=id;
    }
}
