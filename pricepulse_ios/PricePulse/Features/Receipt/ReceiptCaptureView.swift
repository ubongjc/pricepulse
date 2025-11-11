import SwiftUI
import PhotosUI
import AVFoundation

struct ReceiptCaptureView: View {
    @StateObject private var viewModel = ReceiptCaptureViewModel()
    @State private var showingImagePicker = false
    @State private var showingCamera = false
    @State private var selectedItem: PhotosPickerItem?

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                if let image = viewModel.capturedImage {
                    // Show captured receipt
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFit()
                        .frame(maxHeight: 300)
                        .cornerRadius(12)
                        .shadow(radius: 4)

                    if viewModel.isProcessing {
                        VStack(spacing: 12) {
                            ProgressView()
                            Text("Processing receipt...")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    } else {
                        // Manual entry form or OCR results
                        ReceiptDetailsForm(viewModel: viewModel)
                    }
                } else {
                    // Capture options
                    VStack(spacing: 16) {
                        Image(systemName: "camera.viewfinder")
                            .font(.system(size: 80))
                            .foregroundStyle(.blue.opacity(0.5))

                        Text("Capture a Receipt")
                            .font(.title2)
                            .fontWeight(.semibold)

                        Text("Take a photo or choose from your library")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding()

                    Spacer()

                    VStack(spacing: 12) {
                        Button {
                            showingCamera = true
                        } label: {
                            Label("Take Photo", systemImage: "camera")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }

                        PhotosPicker(selection: $selectedItem, matching: .images) {
                            Label("Choose from Library", systemImage: "photo.on.rectangle")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue.opacity(0.1))
                                .foregroundColor(.blue)
                                .cornerRadius(12)
                        }
                    }
                }

                Spacer()
            }
            .padding()
            .navigationTitle("Scan Receipt")
            .toolbar {
                if viewModel.capturedImage != nil {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") {
                            viewModel.reset()
                        }
                    }

                    ToolbarItem(placement: .confirmationAction) {
                        Button("Save") {
                            Task {
                                await viewModel.saveReceipt()
                            }
                        }
                        .disabled(viewModel.isProcessing || !viewModel.isValid)
                    }
                }
            }
            .sheet(isPresented: $showingCamera) {
                CameraView { image in
                    viewModel.capturedImage = image
                    showingCamera = false
                }
            }
            .onChange(of: selectedItem) { _, newValue in
                Task {
                    if let data = try? await newValue?.loadTransferable(type: Data.self),
                       let image = UIImage(data: data) {
                        viewModel.capturedImage = image
                        await viewModel.processImage()
                    }
                }
            }
            .alert("Error", isPresented: .constant(viewModel.error != nil)) {
                Button("OK") {
                    viewModel.error = nil
                }
            } message: {
                if let error = viewModel.error {
                    Text(error.localizedDescription)
                }
            }
        }
    }
}

struct ReceiptDetailsForm: View {
    @ObservedObject var viewModel: ReceiptCaptureViewModel

    var body: some View {
        Form {
            Section("Store Information") {
                TextField("Store Name", text: $viewModel.storeName)
                TextField("Postal Code", text: $viewModel.postalCode)
            }

            Section("Receipt Details") {
                DatePicker("Date", selection: $viewModel.transactionDate, displayedComponents: .date)
                TextField("Total Amount", value: $viewModel.totalAmount, format: .currency(code: "USD"))
                    .keyboardType(.decimalPad)
            }

            Section("Line Items") {
                ForEach($viewModel.lineItems) { $item in
                    VStack(alignment: .leading, spacing: 4) {
                        TextField("Product", text: $item.productName)
                        HStack {
                            TextField("Qty", value: $item.quantity, format: .number)
                                .keyboardType(.decimalPad)
                                .frame(width: 60)
                            TextField("Price", value: $item.totalPrice, format: .currency(code: "USD"))
                                .keyboardType(.decimalPad)
                        }
                    }
                }
                .onDelete { indexSet in
                    viewModel.lineItems.remove(atOffsets: indexSet)
                }

                Button("Add Item") {
                    viewModel.addLineItem()
                }
            }
        }
        .scrollContentBackground(.hidden)
    }
}

struct CameraView: UIViewControllerRepresentable {
    var onCapture: (UIImage) -> Void

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(onCapture: onCapture)
    }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        var onCapture: (UIImage) -> Void

        init(onCapture: @escaping (UIImage) -> Void) {
            self.onCapture = onCapture
        }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let image = info[.originalImage] as? UIImage {
                onCapture(image)
            }
            picker.dismiss(animated: true)
        }
    }
}

#Preview {
    ReceiptCaptureView()
        .environmentObject(NetworkManager())
}
