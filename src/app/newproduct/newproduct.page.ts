import { Component, OnInit } from '@angular/core';
import { BaseUI } from '../common/baseui';
import { environment } from 'src/environments/environment';
import { NavController, ToastController, ModalController } from '@ionic/angular';
import { RestService } from '../service/rest.service';
import { UtilsService } from '../service/utils.service';
import { TranslateService } from '@ngx-translate/core';
import { Network } from '@ionic-native/network/ngx';
import { ActivatedRoute } from '@angular/router';
import { Storage } from '@ionic/storage';
import { AdvancedSearchPage } from '../advanced-search/advanced-search.page';
import { CartService } from '../service/cart.service';
import { ICartProduct } from '../interface/icart-product';


@Component({
  selector: 'app-newproduct',
  templateUrl: './newproduct.page.html',
  styleUrls: ['./newproduct.page.scss'],
})
export class NewproductPage extends BaseUI {
  loading: boolean = true;
  SecondReferenceId: number = 0;
  Title: string = '';
  productList: any[] = [];
  step: number = 10;
  counter: number = 0;
  PageType: string;

  layoutColumn: boolean = false;

  public advancedSearchCriteria: any = {
    SearchText: null,
    MainCategory: null,
    SecondCategory: null,
    PriceInterval: { lower: 0, upper: 200 },
    MinQuantity: 200,
    OrderBy: null
  };
  public host = environment.SERVER_API_URL;
  public logined: boolean = false; // todo: set to false, true only for dev 

  constructor(
    public router: ActivatedRoute,
    public navCtrl: NavController,
    public network: Network,
    public rest: RestService,
    public toastCtrl: ToastController,
    public storage: Storage,
    public utils: UtilsService,
    public modalCtrl: ModalController,
    public translate: TranslateService,
    public cartService: CartService
  ) {
    super();
  }

  // TODO: Simplify the error treatement
  ngOnInit() {
    this.checkLogined();

    this.PageType = this.router.snapshot.queryParams["PageType"];
    this.SecondReferenceId = parseInt(this.router.snapshot.queryParams["ReferenceId"]);
    this.Title = this.router.snapshot.queryParams["Title"];
    this.loadProductList();
  }

  toggleLayout(){
    this.layoutColumn = !this.layoutColumn;
    localStorage.setItem('productListLayoutColumn', this.layoutColumn.toString())
  }

  ionViewWillEnter() {
    // only for develop, don't commit for production app
    var layoutColumn = localStorage.getItem('productListLayoutColumn');
    if(layoutColumn!=null){
      this.layoutColumn = JSON.parse(layoutColumn);;
    }
    else{
      this.layoutColumn = true;
    }
  
  }


  productDetail(product) {
    this.navCtrl.navigateForward('ProductDetailPage', {
      queryParams: {
        productId: product.ProductId
      }
    });
  }

  async checkLogined() {
    this.logined = await this.utils.checkIsLogined();
  }

  loadProductList() {
    if (this.PageType != null) {
      switch (this.PageType) {
        case 'BySecondCategory':
          this.rest.GetProductListBySecondCategory(this.SecondReferenceId, this.counter, this.step) // 填写url的参数
            .subscribe(
              f => {
                if (f.Success && f.Data != null) {
                  this.productList = f.Data.ProductListData;
                } else {
                  super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
                }
              },
              error => {
                this.loading = false
                super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
              },
              () => this.loading = false);
          break;
        case 'NewProduct':
          this.rest.GetProductListByPublishDate(this.counter, this.step) // 填写url的参数
            .subscribe(
              f => {
                if (f.Success && f.Data != null) {
                  this.productList = f.Data.ProductListData;
                } else {
                  super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
                }
              },
              error => {
                super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
                this.loading = false;
              },
              () => this.loading = false);
          break;
        case 'PromoProduct':
          this.rest.GetPromotionProduct(this.counter, this.step)  //TODO: change
          .subscribe(
            (f: any) => {
              if (f.ProductList!=null) {
                this.productList = f.ProductList;

              } else {
                super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
              }
            },
            error => {
              super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
              this.loading = false;
            },
            () => this.loading = false
          );
          break;
        case 'BestSalesProduct':
          this.rest.GetProductListBySalesPerformance(this.counter, this.step) // 填写url的参数
            .subscribe(
              f => {
                if (f.Success && f.Data != null) {
                  this.productList = f.Data.ProductListData;
                } else {
                  super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
                }
              },
              error => {
                super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
              },
              () => this.loading = false);
          break;

        case 'FavoriteList':
          this.rest.GetFavoriteListByUserId({
            UserId: localStorage.getItem('userId'),
            Lang: this.translate.defaultLang,
            Begin: this.counter,
            Step: this.step
          }) // 填写url的参数
            .subscribe(
              result => {
                if (result != null && result.TotalCount != null && result.List != null) {
                  this.productList = result.List;
                } else {
                  super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
                }
                this.loading = false
              },
              error => {
                super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
                this.loading = false
              });
          break;

        case 'SimpleProductSearch':
          this.rest.SimpleProductSearch({
            SearchText: this.router.snapshot.queryParams["SearchText"],
            Lang: this.translate.defaultLang,
            Begin: this.counter,
            Step: this.step
          }) // 填写url的参数
            .subscribe(
              result => {
                if (result != null && result.TotalCount != null && result.List != null) {
                  this.productList = result.List;
                } else {
                  super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
                }
                this.loading = false
              },
              error => {
                super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
                this.loading = false
              });
          break;

        case 'LowerPriceProduct':
          this.rest.GetProductByPrice({
            Lang: this.translate.defaultLang,
            Step: this.step,
            Begin: this.counter
          }) // 填写url的参数
            .subscribe(
              result => {
                if (result != null && result.TotalCount != null && result.List != null) {
                  this.productList = result.List;
                } else {
                  super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
                }
                this.loading = false
              },
              error => {
                super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
                this.loading = false
              });
          break;
        case 'AdvancedProductSearch':
          this.loading = true;
          if (this.advancedSearchCriteria != null) {
            var criteria = this.advancedSearchCriteria;
            criteria.Begin = this.counter;
            criteria.Step = this.step;
            criteria.Lang = this.translate.defaultLang;
            criteria.PriceIntervalLower = this.advancedSearchCriteria.PriceInterval.lower;
            criteria.PriceIntervalUpper = this.advancedSearchCriteria.PriceInterval.upper;
            this.rest.AdvancedProductSearchClient(criteria) // 填写url的参数
              .subscribe(
                result => {
                  if (result != null && result.TotalCount != null && result.List != null) {
                    this.productList = result.List;
                  } else {
                    super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
                  }
                  this.loading = false
                },
                error => {
                  super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
                  this.loading = false
                });
          }
          else {
            this.loading = false;
          }
          break;
      }
    }
    else {
      super.showToast(this.toastCtrl, this.translate.instant("Msg_Offline"));
    }
  }

  doInfinite(infiniteScroll) {
    if (this.network.type != 'none') {
      this.counter = this.counter + 1;
      switch (this.PageType) {
        case 'BySecondCategory':
          this.rest.GetProductListBySecondCategory(this.SecondReferenceId, this.counter, this.step) //TODO: change
            .subscribe(
              (f: any) => {
                if (f.Success) {
                  if (f["Data"].TotalCount <= this.step * this.counter) {
                    infiniteScroll.target.complete();
                    // Disable the infinite scroll
                    infiniteScroll.target.disabled = true;
                  }
                  else {
                    this.productList = this.productList.concat(f["Data"].ProductListData != null ? f["Data"].ProductListData : []);
                    infiniteScroll.target.complete();
                  }
                } else {
                  super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
                }
              },
              error => {
                super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
              }
            );
          break;

          case 'PromoProduct':
            this.rest.GetPromotionProduct(this.counter, this.step)  //TODO: change
            .subscribe(
              (f: any) => {
                if (f.ProductList!=null) {
                  if (f.TotalCount <= this.step * this.counter) {
                    infiniteScroll.target.complete();
                    // Disable the infinite scroll
                    infiniteScroll.target.disabled = true;
                  }
                  else {
                    this.productList = this.productList.concat(f.ProductList != null ? f.ProductList : []);
                    infiniteScroll.target.complete();
                  }
  
                } else {
                  super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
                }
              },
              error => {
                super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
              }
            );
            break;
        case 'NewProduct':
          this.rest.GetProductListByPublishDate(this.counter, this.step) //TODO: change
            .subscribe(
              (f: any) => {
                if (f.Success) {
                  if (f["Data"].TotalCount <= this.step * this.counter) {
                    infiniteScroll.target.complete();
                    // Disable the infinite scroll
                    infiniteScroll.target.disabled = true;
                  }
                  else {
                    this.productList = this.productList.concat(f["Data"].ProductListData != null ? f["Data"].ProductListData : []);
                    infiniteScroll.target.complete();
                  }
                } else {
                  super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
                }
              },
              error => {
                super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
              }
            );
          break;
        case 'BestSalesProduct':
          this.rest.GetProductListBySalesPerformance(this.counter, this.step) //TODO: change
            .subscribe(
              (f: any) => {
                if (f.Success) {
                  if (f["Data"].TotalCount <= this.step * this.counter) {
                    infiniteScroll.target.complete();
                    // Disable the infinite scroll
                    infiniteScroll.target.disabled = true;
                  }
                  else {
                    this.productList = this.productList.concat(f["Data"].ProductListData != null ? f["Data"].ProductListData : []);
                    infiniteScroll.target.complete();
                  }
                } else {
                  super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
                }
              },
              error => {
                super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
              }
            );
          break;
        case 'FavoriteList':
          this.rest.GetFavoriteListByUserId({
            UserId: localStorage.getItem('userId'),
            Lang: this.translate.defaultLang,
            Begin: this.counter,
            Step: this.step
          }) //TODO: change
            .subscribe(
              (result: any) => {
                if (result != null && result.TotalCount != null && result.List != null) {
                  if (result.TotalCount <= this.step * this.counter) {
                    infiniteScroll.target.complete();
                    // Disable the infinite scroll
                    infiniteScroll.target.disabled = true;
                  }
                  else {
                    this.productList = this.productList.concat(result.List != null ? result.List : []);
                    infiniteScroll.target.complete();
                  }
                } else {
                  super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
                }
              },
              error => {
                super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
              }
            );
          break;

        case 'LowerPriceProduct':
          this.rest.GetProductByPrice({
            Lang: this.translate.defaultLang,
            Step: this.step,
            Begin: this.counter
          }) //TODO: change
            .subscribe(
              (result: any) => {
                if (result != null && result.TotalCount != null && result.List != null) {
                  if (result.TotalCount <= this.step * this.counter) {
                    infiniteScroll.target.complete();
                    // Disable the infinite scroll
                    infiniteScroll.target.disabled = true;
                  }
                  else {
                    this.productList = this.productList.concat(result.List != null ? result.List : []);
                    infiniteScroll.target.complete();
                  }
                } else {
                  super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
                }
              },
              error => {
                super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
              }
            );
          break;

        case 'SimpleProductSearch':
          this.rest.SimpleProductSearch({
            SearchText: this.router.snapshot.queryParams["SearchText"],
            Lang: this.translate.defaultLang,
            Begin: this.counter,
            Step: this.step
          }) //TODO: change
            .subscribe(
              (result: any) => {
                if (result != null && result.TotalCount != null && result.List != null) {
                  if (result.TotalCount <= this.step * this.counter) {
                    infiniteScroll.target.complete();
                    // Disable the infinite scroll
                    infiniteScroll.target.disabled = true;
                  }
                  else {
                    this.productList = this.productList.concat(result.List != null ? result.List : []);
                    infiniteScroll.target.complete();
                  }
                } else {
                  super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
                }
              },
              error => {
                super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
              }
            );
          break;


        case 'AdvancedProductSearch':
          if (this.advancedSearchCriteria != null) {
            var criteria = this.advancedSearchCriteria;
            criteria.Begin = this.counter;
            criteria.Step = this.step;
            criteria.Lang = this.translate.defaultLang;
            this.rest.AdvancedProductSearchClient(criteria) //TODO: change
              .subscribe(
                (result: any) => {
                  if (result != null && result.TotalCount != null && result.List != null) {
                    if (result.TotalCount <= this.step * this.counter) {
                      infiniteScroll.target.complete();
                      // Disable the infinite scroll
                      infiniteScroll.target.disabled = true;
                    }
                    else {
                      this.productList = this.productList.concat(result.List != null ? result.List : []);
                      infiniteScroll.target.complete();
                    }
                  } else {
                    super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
                  }
                },
                error => {
                  super.showToast(this.toastCtrl, this.translate.instant("Msg_Error"));
                }
              );
          }
          break;

      }
    }
    else {
      super.showToast(this.toastCtrl, this.translate.instant("Msg_Offline"));
    }
  }

  async advancedSearchPage() {
    let searchCriteriaModal = await this.modalCtrl.create({
      component: AdvancedSearchPage,
      componentProps: {
        criteriaPassed: this.advancedSearchCriteria
      }
    });
    await searchCriteriaModal.present();

    const { data } = await searchCriteriaModal.onWillDismiss();

    if (data != null) {
      this.advancedSearchCriteria = data;
      this.loadProductList();
    }

  }

  async addInCart(event: Event, item: ICartProduct) {
    event.stopPropagation();
    this.cartService.addInCart(item);
  }

}
