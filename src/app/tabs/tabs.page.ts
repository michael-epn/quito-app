import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { bookmarkOutline, homeOutline, listOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  imports: [IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel, RouterLink, RouterLinkActive],
})
export class TabsPage {
  constructor() {
    addIcons({ homeOutline, listOutline, bookmarkOutline });
  }
}
