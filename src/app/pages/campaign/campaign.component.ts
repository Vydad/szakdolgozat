import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { updateDoc,Firestore, doc, getDoc, collection, getDocs, arrayRemove } from '@angular/fire/firestore';

@Component({
  selector: 'app-campaign',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, RouterModule],
  templateUrl: './campaign.component.html',
  styleUrls: ['./campaign.component.scss']
})
export class CampaignComponent implements OnInit {
  campaign: any | null = null;
  charactersInCampaign: any[] = [];  
  currentUserId: string | null = null; 
  id:string|null='';
  isOwner: boolean = false;
  showLeavePopup = false;

    constructor(
    private route: ActivatedRoute,
    private firestore: Firestore,
    private afAuth: Auth,
    private router: Router
  ) {}

  async ngOnInit() {
    const campaignId = this.route.snapshot.paramMap.get('id');
    this.id=campaignId;
    if (campaignId) {
      await this.loadCampaign(campaignId);
    }


    onAuthStateChanged(this.afAuth, (user) => {
    this.currentUserId = user?.uid ?? null;
      if (this.campaign && this.campaign.creatorId === this.currentUserId) {
        this.isOwner = true;
      }
    });
    
  }
  async loadCampaign(campaignId: string) {
    const docRef = doc(this.firestore, 'campaigns', campaignId);
    const snap = await getDoc(docRef);


    if (snap.exists()) {
    this.campaign = { id: snap.id, ...snap.data() };
    this.isOwner = this.campaign.createdBy === this.currentUserId;
    this.loadCharacters();
    }
  }
  async loadCharacters() {
    if (!this.campaign?.characterIds?.length) return;


    const charRef = collection(this.firestore, 'character');
    const snap = await getDocs(charRef);


    this.charactersInCampaign = snap.docs
    .filter((doc) => this.campaign.characterIds.includes(doc.id))
    .map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  canOpenCharacter(charUserId: string): boolean {
    return this.currentUserId === charUserId || this.currentUserId === this.campaign?.creatorId;
  }

  openCharacter(id: string) {
    this.router.navigate(['/character-sheet', id]);
  }
 async leaveCampaign() {
    if (!this.currentUserId || !this.campaign?.id) return;

    // Keressük meg azt a karaktert, ami a userhez tartozik a kampányban
    const myCharacter = this.charactersInCampaign
      ?.find(char => char.userId === this.currentUserId);

    if (!myCharacter) {
      return;
    }

    const campaignRef = doc(this.firestore, 'campaigns', this.campaign.id);

    await updateDoc(campaignRef, {
      characterIds: arrayRemove(myCharacter.id)
    });
    const characterRef = doc(this.firestore, `character/${myCharacter.id}`);
      await updateDoc(characterRef, {
        campaign: false
      });

    this.router.navigate(['/campaigns']);
  }
}
