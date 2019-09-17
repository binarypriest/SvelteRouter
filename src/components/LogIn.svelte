<style>
    .row{
        overflow:hidden;
    }
</style>
<script>
  export let nav;
  export let naver;
    document.title = 'Login | ELI';
    function logIn(){
      naver.set('/nav');
    }
</script>
<div class="row" style="height:80vh">
    <div class="col s12 m4 offset-m4 valign-wrapper" style="height:80vh">
      <div class="card gray lighten-1 valign z-depth-3">
        <div class="card-content white-text">
          <div class="card-title center-align">
            <img src="/images/ELIicon.png" alt="ELI Icon" class="card-img" />
          </div>
          <div class="row">
            <form class="col s12">
                <div class="row">
                    <div class="input-field col s12">
                        <input id="user_name" type="text" class="validate">
                        <label for="user_name">Username</label>
                    </div>
                    <div class="input-field col s12">
                        <input id="pass_word" type="password" class="validate">
                        <label for="pass_word">Password</label>
                    </div>
                    <div class="col s12">
                        <label>
                            <input type="checkbox" />
                            <span>Remember Me</span>
                        </label>
                    </div>
                    <div class="col s12 center-align">
                        <button type="button" class="waves-effect waves-light btn blue" on:click={logIn}>Log In</button>
                    </div>
                </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>