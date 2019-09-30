
<script>
    import { onMount } from 'svelte';
    let users = [];
    let selection;
    let usr;
    let user = {
        fname:'',
        lname:''
    }
    function addUser(){
        users = [...users, JSON.parse(JSON.stringify(user))];
        user.fname = '';
        user.lname = '';
    }
    function removeUser(){
        users.splice(users.indexOf(usr),1);
        users = users;
    }
    function selectItem(e, u){
        usr = u;
        selection = e.target;
        let count = 0;
        while(count < selection.parentNode.children.length){
            selection.parentNode.children[count].classList.remove('active');
            count += 1;
        }
        selection.classList.add('active');    
    }
    onMount(()=>{
    });
</script>
<div class="row">
    <div class="col">
        <form>
            <div class="form-group">
                <input type="text" class="form-control" bind:value={user.fname} placeholder="First Name" />
            </div>
            <div class="form-group">
                <input type="text" class="form-control" bind:value={user.lname} placeholder="Last Name" />
            </div>
            <button type="button" class="btn btn-success" on:click={addUser}>Add</button>
            <button type="button" class="btn btn-danger" on:click={removeUser}>Remove</button>
        </form>
    </div>
</div>
<div class="row">
    <div class="col">
        <ul class="list-group mt-2">
            {#each users as user, i}
                <li class="list-group-item" on:click={(e) =>selectItem(e, user)}>{user.lname}, {user.fname}</li>
            {/each}
        </ul>
    </div>
</div>