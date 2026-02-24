import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terms',
  imports: [CommonModule],
  templateUrl: './terms.html',
  styleUrl: './terms.css',
})
export class Terms {
  // Track which policies are expanded
  expandedPolicies: { [key: number]: boolean } = {};

  togglePolicy(policyNumber: number): void {
    this.expandedPolicies[policyNumber] = !this.expandedPolicies[policyNumber];
  }

  isPolicyExpanded(policyNumber: number): boolean {
    return this.expandedPolicies[policyNumber] || false;
  }
}
