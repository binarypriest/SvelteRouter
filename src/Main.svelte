<script>
  import { onMount } from 'svelte';
  let employees = [];
  onMount(()=>{
    let url = 'https://randomuser.me/api/?results=10';
    fetch(url).then((resp) => resp.json())
    .then(function(data){
      employees = data.results;
    }).catch(function(error){
      console.log(error);
    });
  });
</script>
<style>
  .table > tbody > tr > td{
    vertical-align:middle;
  }
</style>
<div class="row">
  <div class="col">
    <table class="table table-bordered">
      <thead class="thead-dark">
        <tr>
          <th scope="col">#</th>
          <th scope="col">Employee</th>
          <th scope="col">First</th>
          <th scope="col">Last</th>
          <th scope="col">Email</th>
          <th scope="col">Cell</th>
          <th scope="col" class="text-center">Status</th>
        </tr>
      </thead>
      <tbody>
        {#each employees as employee, i}
          <tr>
            <td>{i + 1}</td>
            <td>
                <div class="media">
                  <img src="{employee.picture.thumbnail}" alt="Employee Image" />
                </div>
            </td>
            <td>{employee.name.first}</td>
            <td>{employee.name.last}</td>
            <td>{employee.email}</td>
            <td>{employee.cell}</td>
            <td class="text-center">
              {#if employee.isActive == true}
                <i class="fas fa-check text-success"></i>
              {:else}
                <i class="fas fa-ban text-danger"></i>
              {/if}
            </td>

          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>