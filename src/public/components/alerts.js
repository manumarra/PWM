const banner = [`
    <span id="statusAlertIcon" class="alert-icon"></span>
    <div class="alert-content">
      <strong id="statusAlertTitle"></strong>
      <p id="statusAlertMsg" class="mb-0"></p>
    </div>
    <button type="button" class="btn-close-alert" id="statusAlertClose">&times;</button>
`];

getAlert = () => {
    const container = document.getElementById("statusAlert");
    container.innerHTML = banner;
}