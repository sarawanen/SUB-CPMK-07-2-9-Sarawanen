(function(){
  // ---------- State ----------
  let data = [];          // menyimpan seluruh data pengajuan
  let nomorUrut = 1;       // penomoran tiket berurutan (PGJ-001, PGJ-002, ...)
  let editId = null;       // id yang sedang diedit, null jika mode tambah baru

  // ---------- Elemen ----------
  const form = document.getElementById('formPengajuan');
  const tbody = document.getElementById('tbodyRiwayat');
  const emptyState = document.getElementById('emptyState');
  const rowCount = document.getElementById('rowCount');
  const formModeLabel = document.getElementById('formMode');
  const btnSubmit = document.getElementById('btnSubmit');
  const btnBatal = document.getElementById('btnBatal');
  const toast = document.getElementById('toast');

  const inputs = {
    nama: document.getElementById('nama'),
    nik: document.getElementById('nik'),
    layanan: document.getElementById('layanan'),
    tanggal: document.getElementById('tanggal'),
    keterangan: document.getElementById('keterangan')
  };

  // ---------- Util ----------
  function showToast(msg, isDanger){
    toast.textContent = msg;
    toast.classList.toggle('danger', !!isDanger);
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function formatTanggal(iso){
    if(!iso) return '-';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
  }

  function clearError(fieldId){
    document.getElementById('field-' + fieldId).classList.remove('invalid');
  }
  function setError(fieldId){
    document.getElementById('field-' + fieldId).classList.add('invalid');
  }

  // ---------- Validasi ----------
  function validate(){
    let valid = true;

    if(inputs.nama.value.trim().length < 3){
      setError('nama'); valid = false;
    } else clearError('nama');

    if(!/^\d{16}$/.test(inputs.nik.value.trim())){
      setError('nik'); valid = false;
    } else clearError('nik');

    if(!inputs.layanan.value){
      setError('layanan'); valid = false;
    } else clearError('layanan');

    if(!inputs.tanggal.value){
      setError('tanggal'); valid = false;
    } else clearError('tanggal');

    return valid;
  }

  // ---------- Render tabel (manipulasi DOM) ----------
  function render(){
    tbody.innerHTML = '';

    if(data.length === 0){
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
    }

    data.forEach(item => {
      const tr = document.createElement('tr');

      const statusClass = item.status === 'Selesai' ? 'selesai'
                          : item.status === 'Diproses' ? 'diproses'
                          : 'pending';

      tr.innerHTML = `
        <td class="ticket-id">${item.tiket}</td>
        <td>${item.nama}</td>
        <td>${item.nik}</td>
        <td>${item.layanan}</td>
        <td>${formatTanggal(item.tanggal)}</td>
        <td><span class="badge ${statusClass}">${item.status}</span></td>
        <td>
          <div class="row-actions">
            <button class="icon-btn edit" data-id="${item.id}">Edit</button>
            <button class="icon-btn del" data-id="${item.id}">Hapus</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    rowCount.textContent = data.length + (data.length === 1 ? ' pengajuan' : ' pengajuan');
  }

  // ---------- Reset form ke mode "tambah" ----------
  function resetForm(){
    form.reset();
    editId = null;
    btnSubmit.textContent = 'Ajukan';
    formModeLabel.style.display = 'none';
    Object.keys(inputs).forEach(k => clearError(k));
  }

  // ---------- Event: submit form (tambah / simpan hasil edit) ----------
  form.addEventListener('submit', function(e){
    e.preventDefault(); // mencegah reload halaman

    if(!validate()){
      showToast('Periksa kembali data yang dimasukkan', true);
      return;
    }

    if(editId === null){
      // Tambah data baru
      const item = {
        id: Date.now(),
        tiket: 'PGJ-' + String(nomorUrut).padStart(3, '0'),
        nama: inputs.nama.value.trim(),
        nik: inputs.nik.value.trim(),
        layanan: inputs.layanan.value,
        tanggal: inputs.tanggal.value,
        keterangan: inputs.keterangan.value.trim(),
        status: 'Pending'
      };
      nomorUrut++;
      data.push(item);
      showToast('Pengajuan ' + item.tiket + ' berhasil ditambahkan');
    } else {
      // Simpan perubahan hasil edit
      const item = data.find(d => d.id === editId);
      item.nama = inputs.nama.value.trim();
      item.nik = inputs.nik.value.trim();
      item.layanan = inputs.layanan.value;
      item.tanggal = inputs.tanggal.value;
      item.keterangan = inputs.keterangan.value.trim();
      showToast('Pengajuan ' + item.tiket + ' berhasil diperbarui');
    }

    render();
    resetForm();
  });

  // ---------- Event: batal (keluar dari mode edit) ----------
  btnBatal.addEventListener('click', resetForm);

  // ---------- Event delegation: tombol Edit & Hapus pada tabel ----------
  tbody.addEventListener('click', function(e){
    const btn = e.target.closest('button');
    if(!btn) return;
    const id = Number(btn.dataset.id);

    if(btn.classList.contains('edit')){
      const item = data.find(d => d.id === id);
      if(!item) return;
      inputs.nama.value = item.nama;
      inputs.nik.value = item.nik;
      inputs.layanan.value = item.layanan;
      inputs.tanggal.value = item.tanggal;
      inputs.keterangan.value = item.keterangan;

      editId = id;
      btnSubmit.textContent = 'Simpan Perubahan';
      formModeLabel.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if(btn.classList.contains('del')){
      const item = data.find(d => d.id === id);
      if(!item) return;
      const konfirmasi = confirm('Hapus pengajuan ' + item.tiket + ' atas nama ' + item.nama + '?');
      if(konfirmasi){
        data = data.filter(d => d.id !== id);
        render();
        showToast('Pengajuan ' + item.tiket + ' dihapus', true);
        if(editId === id) resetForm();
      }
    }
  });

  // ---------- Data contoh awal ----------
  data = [
    { id: 1, tiket: 'PGJ-001', nama: 'Ahmad Fauzi', nik: '1271010101900001', layanan: 'Surat Keterangan Domisili', tanggal: '2026-06-20', keterangan: '', status: 'Selesai' },
    { id: 2, tiket: 'PGJ-002', nama: 'Ratna Sari', nik: '1271020202920002', layanan: 'Pengantar KTP/KK', tanggal: '2026-06-25', keterangan: 'Untuk pembuatan KTP baru', status: 'Diproses' }
  ];
  nomorUrut = 3;

  render();
})();
