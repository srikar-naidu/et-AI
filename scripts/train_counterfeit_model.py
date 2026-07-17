"""Train a reproducible real-vs-fake currency screening model from the Kaggle dataset."""

import argparse
from pathlib import Path

import tensorflow as tf


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", type=Path, required=True, help="Folder containing real/ and fake/ image folders")
    parser.add_argument("--output", type=Path, required=True, help="Output .keras model path")
    parser.add_argument("--epochs", type=int, default=8)
    args = parser.parse_args()

    image_size = (224, 224)
    train = tf.keras.utils.image_dataset_from_directory(
        args.dataset, classes=["real", "fake"], validation_split=0.2, subset="training", seed=42, image_size=image_size, batch_size=32, label_mode="binary"
    )
    validation = tf.keras.utils.image_dataset_from_directory(
        args.dataset, classes=["real", "fake"], validation_split=0.2, subset="validation", seed=42, image_size=image_size, batch_size=32, label_mode="binary"
    )

    # Explicit class ordering maps real -> 0 and fake -> 1, matching the model output.
    augmentation = tf.keras.Sequential([tf.keras.layers.RandomFlip("horizontal"), tf.keras.layers.RandomRotation(0.04), tf.keras.layers.RandomContrast(0.08)])
    base = tf.keras.applications.MobileNetV2(include_top=False, weights="imagenet", input_shape=(224, 224, 3))
    base.trainable = False
    inputs = tf.keras.Input(shape=(224, 224, 3))
    x = augmentation(inputs)
    x = tf.keras.applications.mobilenet_v2.preprocess_input(x)
    x = base(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.25)(x)
    fake_probability = tf.keras.layers.Dense(1, activation="sigmoid", name="fake_probability")(x)
    model = tf.keras.Model(inputs, fake_probability)
    model.compile(optimizer=tf.keras.optimizers.Adam(1e-3), loss="binary_crossentropy", metrics=["accuracy", tf.keras.metrics.AUC(name="auc")])

    train = train.prefetch(tf.data.AUTOTUNE)
    validation = validation.prefetch(tf.data.AUTOTUNE)
    model.fit(train, validation_data=validation, epochs=args.epochs, callbacks=[tf.keras.callbacks.EarlyStopping(patience=2, restore_best_weights=True)])
    args.output.parent.mkdir(parents=True, exist_ok=True)
    model.save(args.output)


if __name__ == "__main__":
    main()
