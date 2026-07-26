import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../../shared/components/layout/sidebar/sidebar';
import { Navbar } from '../../../shared/components/layout/navbar/navbar';

@Component({
  selector: 'psr-pharmacy-layout',
  imports: [RouterOutlet, Sidebar, Navbar],
  templateUrl: './pharmacy-layout.html',
  styleUrl: './pharmacy-layout.scss',
})
export class PharmacyLayout {}
