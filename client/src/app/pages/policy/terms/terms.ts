import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-terms',
  imports: [CommonModule],
  templateUrl: './terms.html',
  styleUrl: './terms.css',
})
export class Terms {
  // Track which policies are expanded
  expandedPolicies: { [key: number]: boolean } = {};

  private fragmentPolicyMap: Record<string, number> = {
    'policy-sales': 1,
    'policy-payment': 2,
    'policy-delivery': 3,
    'policy-return': 4,
    'policy-warranty': 5,
    'policy-support': 6,
    'policy-membership': 7,
  };

  constructor(private route: ActivatedRoute) {
    this.route.fragment.subscribe((fragment) => {
      if (!fragment) {
        return;
      }

      const policyNumber = this.fragmentPolicyMap[fragment];
      if (policyNumber) {
        this.expandedPolicies[policyNumber] = true;
      }

      setTimeout(() => {
        const targetElement = document.getElementById(fragment);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 0);
    });
  }

  togglePolicy(policyNumber: number): void {
    this.expandedPolicies[policyNumber] = !this.expandedPolicies[policyNumber];
  }

  isPolicyExpanded(policyNumber: number): boolean {
    return this.expandedPolicies[policyNumber] || false;
  }
}
