<style>
  #sidebar-wrapper {
    min-height: 100vh;
    margin-left: -15rem;
    -webkit-transition: margin .25s ease-out;
    -moz-transition: margin .25s ease-out;
    -o-transition: margin .25s ease-out;
    transition: margin .25s ease-out;
  }

  #sidebar-wrapper .sidebar-heading {
    padding: 0.875rem 1.25rem;
    font-size: 1.2rem;
  }

  #sidebar-wrapper .list-group {
    width: 15rem;
  }

  #page-content-wrapper {
    min-width: 100vw;
  }

  #wrapper.toggled #sidebar-wrapper {
    margin-left: 0;
  }

  @media (min-width: 768px) {
    #sidebar-wrapper {
      margin-left: 0;
    }

    #page-content-wrapper {
      min-width: 0;
      width: 100%;
    }

    #wrapper.toggled #sidebar-wrapper {
      margin-left: -15rem;
    }
  }
</style>
<script>
  import Container from './Container.svelte';
  import Navigator from './Navigator.svelte';
  import { curRoute, subRoute } from './routes.js';
  import { onMount } from 'svelte';
  let flag = '';
  let id = '';
  export let parms = [];
  function toggle(){
      if(flag != ''){
          flag = '';
      }else{
          flag = 'toggled';
      }
  }
  function logOut(e){
    curRoute.set('/');
  }
  onMount(()=>{
    console.log(parms);
    id = parms[0];
    //id = router.routeParms[0];
  });
</script>
  <div class="d-flex {flag}" id="wrapper">
    <div class="bg-light border-right" id="sidebar-wrapper">
      <div class="sidebar-heading">HFD</div>
      <div class="list-group list-group-flush">
        <Navigator path="/main" lnkClass="list-group-item list-group-item-action bg-light" ctrl={subRoute} content="Dashboard" isLink={true}/>
        <Navigator path="/next" lnkClass="list-group-item list-group-item-action bg-light" ctrl={subRoute} content="Shortcuts" isLink={true}/>
      </div>
    </div>
    <div id="page-content-wrapper">
      <nav class="navbar navbar-expand-lg navbar-light bg-light border-bottom">
        <button class="btn btn-default-outline" id="menu-toggle"on:click={toggle}><i class="fas fa-bars"></i></button>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" 
                aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation" >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarSupportedContent">
          <ul class="navbar-nav ml-auto mt-2 mt-lg-0">
            <li class="nav-item active">
              <span>Hello {id}</span>
              <Navigator path="/" lnkClass="nav-link text-danger" ctrl={curRoute} content="Log Out" isLink={true} func={(e) => logOut(e)} />
            </li>
          </ul>
        </div>
      </nav>
      <div class="container-fluid mt-2">
        <Container />
      </div>
    </div>
  </div>