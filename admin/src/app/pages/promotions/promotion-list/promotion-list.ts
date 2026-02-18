import { Component } from '@angular/core';
import { PromotionForm } from '../promotion-form/promotion-form';
import { Modal } from '../../../components/modal/modal';

@Component({
  selector: 'app-promotion-list',
  imports: [PromotionForm, Modal],
  templateUrl: './promotion-list.html',
  styleUrl: './promotion-list.css',
})
export class PromotionList {

}
