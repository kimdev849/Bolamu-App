import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../../shared/components/layout/sidebar/sidebar';
import { Navbar } from '../../../shared/components/layout/navbar/navbar';

@Component({
  selector: 'psr-delivery-layout',
  imports: [RouterOutlet, Sidebar, Navbar],
  templateUrl: './delivery-layout.html',
  styleUrl: './delivery-layout.scss',
})
export class DeliveryLayout {}
