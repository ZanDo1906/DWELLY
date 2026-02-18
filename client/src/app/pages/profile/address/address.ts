import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Modal } from '../../../components/modal/modal';
import { AddAddressModal } from './add-address-modal/add-address-modal';

@Component({
  selector: 'app-address',
  imports: [CommonModule, Modal, AddAddressModal],
  templateUrl: './address.html',
  styleUrl: './address.css',
})
export class Address {

}
