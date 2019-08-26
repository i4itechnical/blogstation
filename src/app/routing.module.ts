import { NgModule } from '@angular/core';
import {Routes,RouterModule} from '@angular/router';
const routes:Routes = [
  {
    path:'',
    loadChildren:'./auth/auth.module#AuthModule'
  }
]


@NgModule({
  exports: [RouterModule],
  imports: [
    RouterModule.forRoot(routes)
  ]
})
export class RoutingModule { }
