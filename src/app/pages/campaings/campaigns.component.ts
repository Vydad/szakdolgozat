import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Firestore, collection, query, where, getDocs, doc, deleteDoc, getDoc, updateDoc  } from '@angular/fire/firestore';
import { addDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-campaigns',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, RouterModule],
  templateUrl: './campaigns.component.html',
  styleUrls: ['./campaigns.component.scss']
})
export class CampaignsComponent implements OnInit {
  campaigns: any[] = [];
  userCharacters: any[] = [];
  userId: string | null = null;
  showCreatePopup = false;
  newCampaignName = '';
  newCampaignDescription = '';
  showLeavePopup = false;
  id='';

  constructor(
    private firestore: Firestore,
    private auth: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.userId = await this.auth.getUserId();
    if (this.userId) {
      await this.loadCampaigns();
    }
  }

  async loadCampaigns() {
    
  if (!this.userId) return;
  const charRef = collection(this.firestore, 'character');
  const charSnap = await getDocs(query(charRef, where('userId', '==', this.userId)));
  this.userCharacters = charSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const campaignRef = collection(this.firestore, 'campaigns');
  const snap = await getDocs(campaignRef);

  const allCampaigns = snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as any[];

  const campaignsSet = new Map<string, any>();

  // 1) Kampányok ahol a user karakterei szerepelnek
   for (const camp of allCampaigns) {
    if (this.userCharacters?.some(ch => camp.characterIds?.includes(ch.id))) {
      campaignsSet.set(camp.id, camp);
      
    }
  }
  // 2) Kampányok amiket a user hozott létre
  for (const camp of allCampaigns) {
    if (camp.creatorId === this.userId) {
      campaignsSet.set(camp.id, camp);
    }
  }

  // 3) A map-ből vissza a listába (duplikáció nélküli)
  this.campaigns = Array.from(campaignsSet.values());
}


  openCampaign(id: string) {
    this.router.navigate(['/campaign', id]);
  }
  openCreatePopup() {
    this.showCreatePopup = true;
  }

  closeCreatePopup() {
    this.showCreatePopup = false;
    this.newCampaignName = '';
    this.newCampaignDescription = '';
  }
  async createCampaign() {
    if (!this.userId) return;

    if (!this.newCampaignName.trim()) {
      alert("A kampány neve kötelező!");
      return;
    }

    await addDoc(collection(this.firestore, "campaigns"), {
      name: this.newCampaignName,
      description: this.newCampaignDescription,
      creatorId: this.userId,
      characterIds: [],       // később kerülnek bele a karakterek
      createdAt: new Date()
    });

    this.closeCreatePopup();
    await this.loadCampaigns();
  }
  async deleteCampaign() {
    if (!this.id) return;

    try {

      const campaignRef = doc(this.firestore, 'campaigns', this.id);
      const campaignSnap= await getDoc(campaignRef);
      const data = campaignSnap.data();
      for (let i = 0; i < data?.['characterIds'].length; i++) {
        const characterRef = doc(this.firestore, `character/${data?.['characterIds'][i]}`);
        await updateDoc(characterRef, {
          campaign: false
        });

      }
      await deleteDoc(campaignRef);
      this.showLeavePopup=false;
      // Sikeres törlés -> vissza a kampány listához
      this.router.navigate(['/campaigns']);
      await this.loadCampaigns();
    } catch (err) {
      alert("Hiba történt a törlés során!");
    }
  }
  async saveId(id:string){
    this.id=id;

  }
}