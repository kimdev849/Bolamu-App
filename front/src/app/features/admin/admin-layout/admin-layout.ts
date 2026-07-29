import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../../shared/components/layout/sidebar/sidebar';
import { Navbar } from '../../../shared/components/layout/navbar/navbar';

@Component({
  selector: 'psr-admin-layout',
  imports: [RouterOutlet, Sidebar, Navbar],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {}
