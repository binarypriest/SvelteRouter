<style>
  .login-wrapper{    
    height:100vh;
    display: -ms-flexbox;
    display: flex;
    -ms-flex-align: center;
    align-items: center;
    padding-top: 40px;
    padding-bottom: 40px;
    background-color: #f5f5f5;
  }
  .form-signin {
    width: 100%;
    max-width: 330px;
    padding: 15px;
    margin: auto;
  }
  .form-signin .checkbox {
    font-weight: 400;
  }
  .form-signin .form-control {
    position: relative;
    box-sizing: border-box;
    height: auto;
    padding: 10px;
    font-size: 16px;
  }
  .form-signin .form-control:focus {
    z-index: 2;
  }
  .form-signin input[type="email"] {
    margin-bottom: -1px;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;
  }
  .form-signin input[type="password"] {
    margin-bottom: 10px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }
</style>
<script>
  import Navigator from './Navigator.svelte';
  import {fade, fly} from 'svelte/transition';
  let src = 'images/logo.png';
  export let nav;
  export let navctrl;
  document.title = 'Login | ELI';
  function logIn(){
    naver.set('/nav');
  }
</script>
<section class="login-wrapper" out:fade>
  <form class="form-signin">
    <img class="mb-4 mx-auto d-block" {src} alt="" width="72" height="72">
    <label for="inputEmail" class="sr-only">Email address</label>
    <input type="email" id="inputEmail" class="form-control mb-2" placeholder="Email address" required />
    <label for="inputPassword" class="sr-only">Password</label>
    <input type="password" id="inputPassword" class="form-control" placeholder="Password" required>
    <div class="checkbox mb-3">
      <label>
        <input type="checkbox" value="remember-me"> Remember Me
      </label>
    </div>
    <Navigator path="/home/12345" ctrl={navctrl} content="Log In" isLink={false} />
    <p class="mt-5 mb-3 text-muted">&copy; 2017-2019 Health Care Finance Direct</p>
  </form>
</section>