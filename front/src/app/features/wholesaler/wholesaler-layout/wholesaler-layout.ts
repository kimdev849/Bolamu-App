import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../../shared/components/layout/sidebar/sidebar';
import { Navbar } from '../../../shared/components/layout/navbar/navbar';

@Component({
  selector: 'psr-wholesaler-layout',
  imports: [RouterOutlet, Sidebar, Navbar],
  templateUrl: './wholesaler-layout.html',
  styleUrl: './wholesaler-layout.scss',
})
export class WholesalerLayout {}
