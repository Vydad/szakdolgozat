import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { CreateService } from '../../services/charactercreate.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ExpandedClassComponent } from '../../components/expanded-class/expanded-class.component';
import { ExpandedRaceComponent } from '../../components/expanded-race/expanded-race.component';
import { ExpandedBackgroundComponent } from '../../components/expanded-background/expanded-background.component';
import { ExpandedAbilityScoreComponent } from '../../components/expanded-ability_score/expanded-ability_score.component';
import { ExpandedDescriptionComponent } from '../../components/expanded-description/expanded-description.component';
import { ExpandedStarterpackComponent } from '../../components/expanded-starterpack/expanded-starterpack.component';


@Component({
  selector: 'app-charactercreate',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, ExpandedClassComponent, ExpandedRaceComponent, ExpandedBackgroundComponent, ExpandedAbilityScoreComponent, ExpandedDescriptionComponent, ExpandedStarterpackComponent],
  templateUrl: './charactercreate.component.html',
  styleUrls: ['./charactercreate.component.scss']
})
export class CharacterCreateComponent implements OnInit{
  @ViewChild(ExpandedBackgroundComponent) expandedBackgroundComponent!: ExpandedBackgroundComponent;
  @ViewChild(ExpandedRaceComponent) expandedRaceComponent!: ExpandedRaceComponent;
  @ViewChild(ExpandedClassComponent) expandedClassComponent!: ExpandedClassComponent;
  constructor(private createService: CreateService, private auth: Auth) {}
  cards: any[] = [];
  public skill: (string|null)[] = [];
  public tools: (string|null)[] = [];
  public skilli=0;
  public toolsi=0;

  ngOnInit() {
    this.auth.onAuthStateChanged(user => {
      if (user) {
        this.createService.setUserId(user.uid);
      } else {
        this.createService.setUserId(null);
      }
    });
  }
  loadSkill(){
    let storySkills=Object.values(this.expandedBackgroundComponent.loadSkill()).flat()
    let classSkills=Object.values(this.expandedClassComponent.loadSkill()).flat()
    let raceSkills=Object.values(this.expandedRaceComponent.loadSkill()).flat()
    const combinedSkills = [...storySkills, ...classSkills, ...raceSkills];
    this.createService.setSkill(combinedSkills)
  }
  loadTools(){
    let storyTools=Object.values(this.expandedBackgroundComponent.loadTools()).flat()
    let classTools=Object.values(this.expandedClassComponent.loadTools()).flat()
    let raceTools=Object.values(this.expandedRaceComponent.loadTools()).flat()
    const combinedTools = [...storyTools, ...classTools, ...raceTools];
    this.createService.setTools(combinedTools)
  }
  loadLanguage(){
    let storyLanguage=Object.values(this.expandedBackgroundComponent.loadLanguage()).flat()
    let raceLanguage=Object.values(this.expandedRaceComponent.loadLanguage()).flat()
    const combinedTools = [...storyLanguage, ...raceLanguage];
    this.createService.setLanguage(combinedTools);
  }
  mentes(){
    this.loadSkill();
    this.loadTools();
    this.loadLanguage();
    this.createService.dataUpLoad();
  }
}